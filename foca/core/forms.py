from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from .models import Perfil, Emprendimiento, Producto, Cliente, Venta

class RegistroForm(UserCreationForm):
    email = forms.EmailField(required=True)
    nombre_emprendimiento = forms.CharField(max_length=100, required=True, label="Nombre de tu emprendimiento")

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
            emp = Emprendimiento.objects.create(
                nombre=self.cleaned_data['nombre_emprendimiento']
            )
            Perfil.objects.create(
                user=user,
                emprendimiento=emp,
                rol='admin'
            )
        return user

class ProductoForm(forms.ModelForm):
    class Meta:
        model = Producto
        fields = ['nombre', 'descripcion', 'codigo_barra', 'precio_costo', 'precio_venta', 'stock_actual', 'stock_minimo']
        widgets = {
            'descripcion': forms.Textarea(attrs={'rows': 3}),
            'precio_costo': forms.NumberInput(attrs={'step': '0.01'}),
            'precio_venta': forms.NumberInput(attrs={'step': '0.01'}),
        }
        labels = {
            'nombre': 'Nombre del producto',
            'descripcion': 'Descripción',
            'codigo_barra': 'Código de barras (opcional)',
            'precio_costo': 'Precio de costo',
            'precio_venta': 'Precio de venta',
            'stock_actual': 'Stock actual',
            'stock_minimo': 'Stock mínimo',
        }

class ClienteForm(forms.ModelForm):
    class Meta:
        model = Cliente
        fields = ['nombre', 'email', 'telefono', 'direccion', 'cuit']
        widgets = {
            'direccion': forms.Textarea(attrs={'rows': 2}),
        }

class VentaForm(forms.ModelForm):
    class Meta:
        model = Venta
        fields = ['cliente', 'metodo_pago']
        widgets = {
            'cliente': forms.Select(attrs={'class': 'form-select'}),
        }
