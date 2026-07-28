from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('register/', views.register, name='register'),
    path('login/', auth_views.LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    
    # Clientes
    path('clientes/', views.listar_clientes, name='listar_clientes'),
    path('clientes/nuevo/', views.crear_cliente, name='crear_cliente'),
    path('clientes/editar/<int:pk>/', views.editar_cliente, name='editar_cliente'),
    path('clientes/eliminar/<int:pk>/', views.eliminar_cliente, name='eliminar_cliente'),

    # Ventas y carrito
    path('ventas/carrito/', views.ver_carrito, name='ver_carrito'),
    path('ventas/agregar/<int:producto_id>/', views.agregar_al_carrito, name='agregar_al_carrito'),
    path('ventas/quitar/<int:producto_id>/', views.quitar_del_carrito, name='quitar_del_carrito'),
    path('ventas/vaciar/', views.vaciar_carrito, name='vaciar_carrito'),
    path('ventas/finalizar/', views.finalizar_venta, name='finalizar_venta'),
    # Caja
    path('caja/abrir/', views.abrir_caja, name='abrir_caja'),
    path('caja/cerrar/', views.cerrar_caja, name='cerrar_caja'),
    path('caja/estado/', views.estado_caja, name='estado_caja'),
    # Productos
    path('productos/', views.listar_productos, name='listar_productos'),
    path('productos/nuevo/', views.crear_producto, name='crear_producto'),
    path('productos/editar/<int:pk>/', views.editar_producto, name='editar_producto'),
    path('productos/eliminar/<int:pk>/', views.eliminar_producto, name='eliminar_producto'),
    # movimientos de stock
    # Caja
path('caja/', views.estado_caja, name='estado_caja'),
path('caja/abrir/', views.abrir_caja, name='abrir_caja'),
path('caja/cerrar/', views.cerrar_caja, name='cerrar_caja'),
path('caja/movimientos/', views.movimientos_caja, name='movimientos_caja'),

# Ventas - Historial
path('ventas/historial/', views.historial_ventas, name='historial_ventas'),
path('ventas/detalle/<int:pk>/', views.detalle_venta, name='detalle_venta'),

# Inventario - Movimientos de stock
path('stock/movimientos/', views.movimientos_stock, name='movimientos_stock'),

]