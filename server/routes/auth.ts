// Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.error('❌ Password mismatch for user:', email);
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos',
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Password verified successfully');
    console.log('📋 User data from DB:', { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      permissions: user.permissions,
      status: user.status 
    });

// Generate JWT tokens
    const accessToken = jwt.sign(
      { 
        sub: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { 
        sub: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ JWT tokens generated with role:', user.role);
    console.log('🔑 Access token payload:', { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    });