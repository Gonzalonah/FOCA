"""foca/                      # Raíz del proyecto (donde está manage.py)
├── foca/                  # Carpeta del proyecto
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── core/                  # App principal
│   ├── __init__.py
│   ├── models.py
│   ├── views.py
│   ├── forms.py
│   └── urls.py
├── templates/             # ¡Esta carpeta debe existir!
│   ├── base.html
│   ├── registration/
│   │   ├── login.html
│   │   └── register.html
│   └── core/
│       └── dashboard.html
├── manage.py
├── .env
└── vercel.json
"""
from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # Rutas de autenticación y dashboard
    path('', views.dashboard, name='dashboard'),
    path('register/', views.register, name='register'),
    path('login/', auth_views.LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),

    # Rutas de productos (ABM)
    path('productos/', views.producto_list, name='producto_list'),
    path('productos/nuevo/', views.producto_create, name='producto_create'),
    path('productos/editar/<int:pk>/', views.producto_edit, name='producto_edit'),
    path('productos/eliminar/<int:pk>/', views.producto_delete, name='producto_delete'),
]