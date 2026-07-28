import json
from decimal import Decimal
from django.utils import timezone
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import F, Sum
from django.http import JsonResponse

from .forms import RegistroForm, ProductoForm, ClienteForm, VentaForm
from .models import Producto, Caja, Cliente, Venta, DetalleVenta, MovimientoCaja, MovimientoStock, Emprendimiento, Perfil
# ============================================================
# REGISTRO
# ============================================================
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

# ============================================================
# DASHBOARD
# ============================================================
@login_required
def dashboard(request):
    perfil = request.user.perfil
    emp = perfil.emprendimiento
    productos = Producto.objects.filter(emprendimiento=emp)
    caja, _ = Caja.objects.get_or_create(emprendimiento=emp)
    productos_recientes = productos.order_by('-creado')[:5]

    context = {
        'emprendimiento': emp,
        'total_productos': productos.count(),
        'stock_bajo': productos.filter(stock_actual__lte=F('stock_minimo')).count(),
        'saldo_caja': caja.saldo_actual,
        'caja_estado': caja.estado,
        'productos_recientes': productos_recientes,
    }
    return render(request, 'core/dashboard.html', context)


# ============================================================
# CRUD PRODUCTOS
# ============================================================
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

# ============================================================
# CRUD CLIENTES
# ============================================================
@login_required
def listar_clientes(request):
    clientes = Cliente.objects.filter(emprendimiento=request.user.perfil.emprendimiento)
    return render(request, 'core/cliente_list.html', {'clientes': clientes})

@login_required
def crear_cliente(request):
    if request.method == 'POST':
        form = ClienteForm(request.POST)
        if form.is_valid():
            cliente = form.save(commit=False)
            cliente.emprendimiento = request.user.perfil.emprendimiento
            cliente.save()
            messages.success(request, 'Cliente creado.')
            return redirect('listar_clientes')
    else:
        form = ClienteForm()
    return render(request, 'core/cliente_form.html', {'form': form, 'accion': 'Crear'})

@login_required
def editar_cliente(request, pk):
    cliente = get_object_or_404(Cliente, pk=pk, emprendimiento=request.user.perfil.emprendimiento)
    if request.method == 'POST':
        form = ClienteForm(request.POST, instance=cliente)
        if form.is_valid():
            form.save()
            messages.success(request, 'Cliente actualizado.')
            return redirect('listar_clientes')
    else:
        form = ClienteForm(instance=cliente)
    return render(request, 'core/cliente_form.html', {'form': form, 'accion': 'Editar'})

@login_required
def eliminar_cliente(request, pk):
    cliente = get_object_or_404(Cliente, pk=pk, emprendimiento=request.user.perfil.emprendimiento)
    if request.method == 'POST':
        cliente.delete()
        messages.success(request, 'Cliente eliminado.')
        return redirect('listar_clientes')
    return render(request, 'core/cliente_confirm_delete.html', {'cliente': cliente})

# ============================================================
# CARRITO DE COMPRAS (sesión)
# ============================================================
def obtener_carrito(request):
    carrito = request.session.get('carrito', {})
    if not isinstance(carrito, dict):
        carrito = {}
        request.session['carrito'] = carrito
    return carrito

def guardar_carrito(request, carrito):
    request.session['carrito'] = carrito
    request.session.modified = True

@login_required
def ver_carrito(request):
    carrito = obtener_carrito(request)
    items = []
    total = Decimal('0')
    for producto_id, data in carrito.items():
        producto = get_object_or_404(Producto, pk=producto_id, emprendimiento=request.user.perfil.emprendimiento)
        subtotal = Decimal(str(data['cantidad'])) * producto.precio_venta
        items.append({
            'producto': producto,
            'cantidad': data['cantidad'],
            'subtotal': subtotal,
        })
        total += subtotal
    return render(request, 'core/carrito.html', {'items': items, 'total': total})

@login_required
def agregar_al_carrito(request, producto_id):
    producto = get_object_or_404(Producto, pk=producto_id, emprendimiento=request.user.perfil.emprendimiento)
    cantidad = int(request.POST.get('cantidad', 1))
    if cantidad <= 0:
        messages.error(request, 'La cantidad debe ser mayor a cero.')
        return redirect('listar_productos')
    if cantidad > producto.stock_actual:
        messages.error(request, f'No hay suficiente stock. Disponible: {producto.stock_actual}')
        return redirect('listar_productos')
    
    carrito = obtener_carrito(request)
    if str(producto_id) in carrito:
        carrito[str(producto_id)]['cantidad'] += cantidad
    else:
        carrito[str(producto_id)] = {'cantidad': cantidad}
    guardar_carrito(request, carrito)
    messages.success(request, f'{cantidad} x "{producto.nombre}" agregado al carrito.')
    return redirect('ver_carrito')

@login_required
def quitar_del_carrito(request, producto_id):
    carrito = obtener_carrito(request)
    if str(producto_id) in carrito:
        cantidad = int(request.POST.get('cantidad', 1))
        if cantidad <= 0 or carrito[str(producto_id)]['cantidad'] <= cantidad:
            del carrito[str(producto_id)]
        else:
            carrito[str(producto_id)]['cantidad'] -= cantidad
        guardar_carrito(request, carrito)
        messages.success(request, 'Carrito actualizado.')
    else:
        messages.error(request, 'Producto no encontrado en el carrito.')
    return redirect('ver_carrito')

@login_required
def vaciar_carrito(request):
    request.session['carrito'] = {}
    request.session.modified = True
    messages.success(request, 'Carrito vaciado.')
    return redirect('ver_carrito')

# ============================================================
# FINALIZAR VENTA
# ============================================================
@login_required
def finalizar_venta(request):
    carrito = obtener_carrito(request)
    if not carrito:
        messages.error(request, 'El carrito está vacío.')
        return redirect('listar_productos')
    
    if request.method == 'POST':
        form = VentaForm(request.POST)
        if form.is_valid():
            emp = request.user.perfil.emprendimiento
            caja, created = Caja.objects.get_or_create(emprendimiento=emp)
            if caja.estado != 'abierta':
                messages.error(request, 'La caja está cerrada. Debes abrirla primero.')
                return render(request, 'core/finalizar_venta.html', {'form': form, 'items': []})
            
            total = Decimal('0')
            venta = Venta.objects.create(
                emprendimiento=emp,
                cliente=form.cleaned_data['cliente'],
                metodo_pago=form.cleaned_data['metodo_pago'],
                total=0,
                estado='completada'
            )
            
            for producto_id, data in carrito.items():
                producto = get_object_or_404(Producto, pk=producto_id, emprendimiento=emp)
                cantidad = data['cantidad']
                if producto.stock_actual < cantidad:
                    messages.error(request, f'Stock insuficiente para "{producto.nombre}". Disponible: {producto.stock_actual}')
                    venta.delete()
                    return redirect('ver_carrito')
                producto.stock_actual -= cantidad
                producto.save()
                subtotal = producto.precio_venta * cantidad
                total += subtotal
                DetalleVenta.objects.create(
                    venta=venta,
                    producto=producto,
                    cantidad=cantidad,
                    precio_unitario=producto.precio_venta,
                    subtotal=subtotal
                )
            
            venta.total = total
            venta.save()
            
            caja.saldo_actual += total
            caja.save()
            
            MovimientoCaja.objects.create(
                caja=caja,
                tipo='ingreso',
                monto=total,
                descripcion=f'Venta #{venta.id} - {venta.cliente.nombre if venta.cliente else "Cliente genérico"}'
            )
            
            request.session['carrito'] = {}
            request.session.modified = True
            
            messages.success(request, f'¡Venta #{venta.id} realizada con éxito! Total: ${total}')
            return redirect('dashboard')
    else:
        form = VentaForm()
        total = Decimal('0')
        items = []
        for producto_id, data in carrito.items():
            producto = get_object_or_404(Producto, pk=producto_id, emprendimiento=request.user.perfil.emprendimiento)
            subtotal = Decimal(str(data['cantidad'])) * producto.precio_venta
            items.append({
                'producto': producto,
                'cantidad': data['cantidad'],
                'subtotal': subtotal,
            })
            total += subtotal
        
        return render(request, 'core/finalizar_venta.html', {
            'form': form,
            'items': items,
            'total': total
        })

# ============================================================
# GESTIÓN DE CAJA
# ============================================================
@login_required
def abrir_caja(request):
    """Abre la caja del emprendimiento con un saldo inicial."""
    emp = request.user.perfil.emprendimiento
    caja, created = Caja.objects.get_or_create(emprendimiento=emp)
    
    if caja.estado == 'abierta':
        messages.warning(request, 'La caja ya está abierta.')
        return redirect('dashboard')
    
    if request.method == 'POST':
        saldo_inicial = Decimal(request.POST.get('saldo_inicial', 0))
        if saldo_inicial < 0:
            messages.error(request, 'El saldo inicial no puede ser negativo.')
            return redirect('abrir_caja')
        
        caja.saldo_actual = saldo_inicial
        caja.saldo_inicial = saldo_inicial
        caja.fecha_apertura = timezone.now()
        caja.estado = 'abierta'
        caja.save()
        
        MovimientoCaja.objects.create(
            caja=caja,
            tipo='ingreso',
            monto=saldo_inicial,
            descripcion=f'Apertura de caja - Saldo inicial: ${saldo_inicial}'
        )
        
        messages.success(request, f'Caja abierta con saldo inicial de ${saldo_inicial}')
        return redirect('dashboard')
    
    return render(request, 'core/caja_abrir.html', {'caja': caja})

@login_required
def cerrar_caja(request):
    """Cierra la caja y muestra el resumen."""
    emp = request.user.perfil.emprendimiento
    caja = get_object_or_404(Caja, emprendimiento=emp)
    
    if caja.estado == 'cerrada':
        messages.warning(request, 'La caja ya está cerrada.')
        return redirect('dashboard')
    
    if request.method == 'POST':
        caja.fecha_cierre = timezone.now()
        caja.estado = 'cerrada'
        caja.save()
        messages.success(request, f'Caja cerrada. Saldo final: ${caja.saldo_actual}')
        return redirect('dashboard')
    
    # Calcular movimientos del día para mostrar resumen
    movimientos = MovimientoCaja.objects.filter(caja=caja)
    ingresos = movimientos.filter(tipo='ingreso').aggregate(total=Sum('monto'))['total'] or Decimal('0')
    egresos = movimientos.filter(tipo='egreso').aggregate(total=Sum('monto'))['total'] or Decimal('0')
    
    context = {
        'caja': caja,
        'ingresos': ingresos,
        'egresos': egresos,
        'saldo_esperado': caja.saldo_inicial + ingresos - egresos,
    }
    return render(request, 'core/caja_cerrar.html', context)

@login_required
def estado_caja(request):
    """Muestra el estado actual de la caja y los últimos movimientos."""
    emp = request.user.perfil.emprendimiento
    caja, created = Caja.objects.get_or_create(emprendimiento=emp)
    movimientos = MovimientoCaja.objects.filter(caja=caja).order_by('-fecha')[:20]
    
    context = {
        'caja': caja,
        'movimientos': movimientos,
    }
    return render(request, 'core/caja_estado.html', context)
# ---------- Caja ----------
@login_required
def estado_caja(request):
    """Muestra el estado actual de la caja y permite abrir/cerrar."""
    emp = request.user.perfil.emprendimiento
    caja, created = Caja.objects.get_or_create(emprendimiento=emp)
    return render(request, 'core/estado_caja.html', {'caja': caja})

@login_required
def abrir_caja(request):
    emp = request.user.perfil.emprendimiento
    caja, created = Caja.objects.get_or_create(emprendimiento=emp)
    
    if caja.estado == 'abierta':
        messages.warning(request, 'La caja ya está abierta.')
        return redirect('estado_caja')
    
    if request.method == 'POST':
        form = AbrirCajaForm(request.POST)
        if form.is_valid():
            saldo_inicial = form.cleaned_data['saldo_inicial']
            caja.saldo_actual = saldo_inicial
            caja.saldo_inicial = saldo_inicial
            caja.estado = 'abierta'
            caja.fecha_apertura = timezone.now()
            caja.save()
            # Registrar movimiento de apertura
            MovimientoCaja.objects.create(
                caja=caja,
                tipo='ingreso',
                monto=saldo_inicial,
                descripcion='Apertura de caja'
            )
            messages.success(request, f'Caja abierta con ${saldo_inicial}')
            return redirect('estado_caja')
    else:
        form = AbrirCajaForm()
    
    return render(request, 'core/abrir_caja.html', {'form': form, 'caja': caja})

@login_required
def cerrar_caja(request):
    emp = request.user.perfil.emprendimiento
    caja = get_object_or_404(Caja, emprendimiento=emp)
    
    if caja.estado != 'abierta':
        messages.warning(request, 'La caja ya está cerrada.')
        return redirect('estado_caja')
    
    if request.method == 'POST':
        # Registrar el cierre
        caja.estado = 'cerrada'
        caja.fecha_cierre = timezone.now()
        # Opcional: registrar un egreso por el retiro de efectivo (cierre)
        # Si quieres que el saldo se reinicie a 0 al cerrar, puedes hacerlo.
        # Pero mejor lo dejamos como está y el usuario puede hacer un arqueo.
        caja.save()
        messages.success(request, 'Caja cerrada correctamente.')
        return redirect('estado_caja')
    
    # GET: confirmación
    return render(request, 'core/cerrar_caja.html', {'caja': caja})

@login_required
def movimientos_caja(request):
    emp = request.user.perfil.emprendimiento
    caja = get_object_or_404(Caja, emprendimiento=emp)
    movimientos = MovimientoCaja.objects.filter(caja=caja).order_by('-fecha')
    return render(request, 'core/movimientos_caja.html', {
        'movimientos': movimientos,
        'caja': caja
    })

# ---------- Historial de Ventas ----------
@login_required
def historial_ventas(request):
    emp = request.user.perfil.emprendimiento
    ventas = Venta.objects.filter(emprendimiento=emp).order_by('-fecha')
    return render(request, 'core/historial_ventas.html', {'ventas': ventas})

@login_required
def detalle_venta(request, pk):
    emp = request.user.perfil.emprendimiento
    venta = get_object_or_404(Venta, pk=pk, emprendimiento=emp)
    detalles = DetalleVenta.objects.filter(venta=venta)
    return render(request, 'core/detalle_venta.html', {
        'venta': venta,
        'detalles': detalles
    })

# ---------- Movimientos de Stock ----------
@login_required
def movimientos_stock(request):
    emp = request.user.perfil.emprendimiento
    movimientos = MovimientoStock.objects.filter(emprendimiento=emp).order_by('-fecha')
    return render(request, 'core/movimientos_stock.html', {'movimientos': movimientos})

