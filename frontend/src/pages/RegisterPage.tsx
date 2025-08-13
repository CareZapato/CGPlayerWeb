import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { RegisterData } from '../types';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const { login: setAuth, isAuthenticated } = useAuthStore();

  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: (response) => {
      setAuth(response.data.user, response.data.token);
      toast.success('¡Cuenta creada exitosamente!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear la cuenta');
    }
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Únete al coro digital ChileGospel
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="input"
                placeholder="Nombre"
                value={formData.firstName}
                onChange={handleChange}
              />
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="input"
                placeholder="Apellido"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
            
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
            
            <input
              id="username"
              name="username"
              type="text"
              required
              className="input"
              placeholder="Nombre de usuario"
              value={formData.username}
              onChange={handleChange}
            />
            
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input"
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="btn-primary w-full"
            >
              {registerMutation.isPending ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </div>

          <div className="text-center">
            <span className="text-gray-600">¿Ya tienes cuenta? </span>
            <Link to="/login" className="text-primary-600 hover:text-primary-500">
              Iniciar sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
