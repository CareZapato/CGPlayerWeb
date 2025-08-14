import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';

const router = express.Router();

// Registro de usuario
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3 }).trim(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password, firstName, lastName } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName
      }
    });

    // Asignar rol CANTANTE por defecto usando SQL raw
    await prisma.$executeRaw`
      INSERT INTO user_roles (id, "userId", role, "createdAt")
      VALUES (gen_random_uuid(), ${user.id}, 'CANTANTE', NOW())
    `;

    // Obtener roles del usuario usando query raw
    const userRoles = await prisma.$queryRaw`
      SELECT role FROM user_roles WHERE "userId" = ${user.id}
    `;
    const roles = (userRoles as any[]).map(r => r.role);

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, roles },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Mapear roles al formato esperado por el frontend
    const formattedRoles = roles.map((role: string) => ({
      id: `${user.id}_${role}`, // ID temporal para el frontend
      userId: user.id,
      role: role,
      isActive: true,
      assignedAt: new Date().toISOString()
    }));

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: formattedRoles
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login de usuario
router.post('/login', [
  body('login').notEmpty().trim(),
  body('password').notEmpty()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { login, password } = req.body;

    // Buscar usuario por email o username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: login },
          { username: login }
        ],
        isActive: true
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Obtener roles del usuario usando query raw
    const userRoleRows = await prisma.$queryRaw`
      SELECT role FROM user_roles WHERE "userId" = ${user.id}
    `;
    const userRoles = (userRoleRows as any[]).map(r => r.role);

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, roles: userRoles },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Respuesta sin contraseña  
    const { password: _, ...userWithoutPassword } = user;

    // Mapear roles al formato esperado por el frontend
    const formattedRoles = userRoles.map((role: string) => ({
      id: `${user.id}_${role}`, // ID temporal para el frontend
      userId: user.id,
      role: role,
      isActive: true,
      assignedAt: new Date().toISOString()
    }));

    res.json({
      message: 'Login successful',
      user: { ...userWithoutPassword, roles: formattedRoles },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Verificar token
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Obtener roles del usuario usando query raw
    const userRoleRows = await prisma.$queryRaw`
      SELECT role FROM user_roles WHERE "userId" = ${user.id}
    `;
    const userRoles = (userRoleRows as any[]).map(r => r.role);
    const { password: _, ...userWithoutPassword } = user;

    // Mapear roles al formato esperado por el frontend
    const formattedRoles = userRoles.map((role: string) => ({
      id: `${user.id}_${role}`, // ID temporal para el frontend
      userId: user.id,
      role: role,
      isActive: true,
      assignedAt: new Date().toISOString()
    }));

    res.json({ 
      user: { ...userWithoutPassword, roles: formattedRoles }
    });

  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
});

export default router;
