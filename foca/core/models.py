from django.db import models
from django.contrib.auth.models import User

class Emprendimiento(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    config = models.JSONField(default=dict, blank=True)
    creado = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre

class Perfil(models.Model):
    ROLES = (
        ('admin', 'Administrador'),
        ('gerente', 'Gerente'),
        ('vendedor', 'Vendedor'),
        ('cajero', 'Cajero'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    emprendimiento = models.ForeignKey(Emprendimiento, on_delete=models.CASCADE)  # ya no es nullable
    rol = models.CharField(max_length=20, choices=ROLES, default='admin')  # por defecto admin
    permisos_extra = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.emprendimiento.nombre}"


class Producto(models.Model):
    emprendimiento = models.ForeignKey(Emprendimiento, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    codigo_barra = models.CharField(max_length=50, unique=True, null=True, blank=True)
    precio_costo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock_actual = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=0)
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre
    
    class Meta:
        ordering = ['nombre']

class Caja(models.Model):
    emprendimiento = models.OneToOneField('Emprendimiento', on_delete=models.CASCADE)
    saldo_actual = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    saldo_inicial = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fecha_apertura = models.DateTimeField(null=True, blank=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, default='cerrada')

    def __str__(self):
        return f"Caja de {self.emprendimiento.nombre}"
    
class MovimientoStock(models.Model):
    TIPO = (
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
        ('ajuste', 'Ajuste'),
    )
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    emprendimiento = models.ForeignKey(Emprendimiento, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=10, choices=TIPO)
    cantidad = models.IntegerField()
    motivo = models.CharField(max_length=200)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.producto.nombre} - {self.tipo} {self.cantidad}"


# Cliente
class Cliente(models.Model):
    emprendimiento = models.ForeignKey(Emprendimiento, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    direccion = models.TextField(blank=True)
    cuit = models.CharField(max_length=20, blank=True)
    creado = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre

# Venta
class Venta(models.Model):
    emprendimiento = models.ForeignKey(Emprendimiento, on_delete=models.CASCADE)
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    metodo_pago = models.CharField(max_length=50, default='efectivo')
    factura_electronica = models.CharField(max_length=50, blank=True)
    estado = models.CharField(max_length=20, default='completada')
    creado = models.DateTimeField(auto_now_add=True)

# DetalleVenta
class DetalleVenta(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

class MovimientoCaja(models.Model):
    TIPO = (('ingreso', 'Ingreso'), ('egreso', 'Egreso'))
    caja = models.ForeignKey(Caja, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=10, choices=TIPO)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    descripcion = models.CharField(max_length=200)
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tipo} - ${self.monto}"
