from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
# from django.db.models import F  # lo comentamos porque no lo usaremos aún
from .forms import RegistroForm
from .models import Producto
from .forms import ProductoForm
from .decorators import emprendimiento_required  # si lo tienes, sino lo creamos
# from .models import Producto, Caja  # lo comentamos porque aún no existen

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
    # Por ahora valores fijos mientras no tengamos los modelos
    context = {
        'emprendimiento': emp,
        'total_productos': 0,
        'stock_bajo': 0,
        'saldo_caja': 0,
    }
    return render(request, 'core/dashboard.html', context)


@login_required
def producto_list(request):
    """Lista todos los productos del emprendimiento del usuario"""
    emp = request.user.perfil.emprendimiento
    productos = Producto.objects.filter(emprendimiento=emp)
    return render(request, 'core/producto_list.html', {'productos': productos})

@login_required
def producto_create(request):
    """Crear un nuevo producto"""
    emp = request.user.perfil.emprendimiento
    if request.method == 'POST':
        form = ProductoForm(request.POST)
        if form.is_valid():
            producto = form.save(commit=False)
            producto.emprendimiento = emp
            producto.save()
            messages.success(request, f"Producto '{producto.nombre}' creado con éxito.")
            return redirect('producto_list')
    else:
        form = ProductoForm()
    return render(request, 'core/producto_form.html', {'form': form, 'action': 'Crear'})

@login_required
def producto_edit(request, pk):
    """Editar un producto existente"""
    emp = request.user.perfil.emprendimiento
    producto = get_object_or_404(Producto, pk=pk, emprendimiento=emp)
    if request.method == 'POST':
        form = ProductoForm(request.POST, instance=producto)
        if form.is_valid():
            form.save()
            messages.success(request, f"Producto '{producto.nombre}' actualizado con éxito.")
            return redirect('producto_list')
    else:
        form = ProductoForm(instance=producto)
    return render(request, 'core/producto_form.html', {'form': form, 'action': 'Editar', 'producto': producto})

@login_required
def producto_delete(request, pk):
    """Eliminar un producto (con confirmación)"""
    emp = request.user.perfil.emprendimiento
    producto = get_object_or_404(Producto, pk=pk, emprendimiento=emp)
    if request.method == 'POST':
        nombre = producto.nombre
        producto.delete()
        messages.success(request, f"Producto '{nombre}' eliminado con éxito.")
        return redirect('producto_list')
    return render(request, 'core/producto_confirm_delete.html', {'producto': producto})