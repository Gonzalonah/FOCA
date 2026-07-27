from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import F
from .forms import RegistroForm, ProductoForm
from .models import Producto, Caja

def register(request):
    if request.method == 'POST':
        form = RegistroForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f"¡Emprendimiento '{user.perfil.emprendimiento.nombre}' creado con éxito!")
            return redirect('dashboard')
    else:
        form = RegistroForm()
    return render(request, 'registration/register.html', {'form': form})

@login_required
def dashboard(request):
    perfil = request.user.perfil
    emp = perfil.emprendimiento
    productos = Producto.objects.filter(emprendimiento=emp)
    caja, _ = Caja.objects.get_or_create(emprendimiento=emp)
    context = {
        'emprendimiento': emp,
        'total_productos': productos.count(),
        'stock_bajo': productos.filter(stock_actual__lte=F('stock_minimo')).count(),
        'saldo_caja': caja.saldo_actual,
    }
    return render(request, 'core/dashboard.html', context)

@login_required
def listar_productos(request):
    productos = Producto.objects.filter(emprendimiento=request.user.perfil.emprendimiento)
    return render(request, 'core/producto_list.html', {'productos': productos})

@login_required
def crear_producto(request):
    if request.method == 'POST':
        form = ProductoForm(request.POST)
        if form.is_valid():
            producto = form.save(commit=False)
            producto.emprendimiento = request.user.perfil.emprendimiento
            producto.save()
            messages.success(request, 'Producto creado exitosamente.')
            return redirect('listar_productos')
    else:
        form = ProductoForm()
    return render(request, 'core/producto_form.html', {'form': form, 'accion': 'Crear'})

@login_required
def editar_producto(request, pk):
    producto = get_object_or_404(Producto, pk=pk, emprendimiento=request.user.perfil.emprendimiento)
    if request.method == 'POST':
        form = ProductoForm(request.POST, instance=producto)
        if form.is_valid():
            form.save()
            messages.success(request, 'Producto actualizado correctamente.')
            return redirect('listar_productos')
    else:
        form = ProductoForm(instance=producto)
    return render(request, 'core/producto_form.html', {'form': form, 'accion': 'Editar'})

@login_required
def eliminar_producto(request, pk):
    producto = get_object_or_404(Producto, pk=pk, emprendimiento=request.user.perfil.emprendimiento)
    if request.method == 'POST':
        producto.delete()
        messages.success(request, 'Producto eliminado.')
        return redirect('listar_productos')
    return render(request, 'core/producto_confirm_delete.html', {'producto': producto})