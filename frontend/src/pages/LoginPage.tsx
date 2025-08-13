import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { LoginCredentials } from '../types';

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    login: '',
    password: ''
  });

  const { login: setAuth, isAuthenticated } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (response) => {
      setAuth(response.data.user, response.data.token);
      toast.success('¡Bienvenido!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
    }
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(credentials);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            CGPlayerWeb
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Iniciar sesión en tu cuenta
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="login"
                name="login"
                type="text"
                required
                className="input"
                placeholder="Email o nombre de usuario"
                value={credentials.login}
                onChange={handleChange}
              />
            </div>
            <div className="mt-4">
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input"
                placeholder="Contraseña"
                value={credentials.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn-primary w-full"
            >
              {loginMutation.isPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>

          <div className="text-center">
            <span className="text-gray-600">¿No tienes cuenta? </span>
            <Link to="/register" className="text-primary-600 hover:text-primary-500">
              Registrarse
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
