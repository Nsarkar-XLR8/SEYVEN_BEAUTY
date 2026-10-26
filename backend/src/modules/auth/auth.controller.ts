import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RefreshTokenDto, RegisterDto, ResetPasswordDto, SendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { JwtAuthGuard, AuthenticatedRequest } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register customer with Name, Phone, Email, Password' })
  @ApiResponse({ status: 201, description: 'Account created and tokens issued successfully' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login customer with Phone or Email and Password' })
  @ApiResponse({ status: 200, description: 'Logged in successfully' })
  login(@Body() dto: LoginDto) {
    return this.authService.loginWithPassword(dto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Send 6-digit password reset verification code to customer email via Resend' })
  @ApiResponse({ status: 200, description: 'Reset code dispatched successfully' })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    return this.authService.forgotPassword(dto.email, ip);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Verify 6-digit code and reset customer password with auto-login' })
  @ApiResponse({ status: 200, description: 'Password reset successfully, auth tokens issued' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('otp/send')
  @ApiOperation({ summary: 'Send OTP for passwordless authentication' })
  @ApiResponse({ status: 201, description: 'OTP dispatched successfully via SMS/Mock' })
  @ApiResponse({ status: 400, description: 'Invalid phone format or rate limited' })
  sendOtp(@Body() dto: SendOtpDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    return this.authService.sendOtp(dto.phone, ip);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP code and issue JWT keypair' })
  @ApiResponse({ status: 201, description: 'Tokens issued successfully with user profile' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP code' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtpAndLogin(dto.phone, dto.code);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @ApiResponse({ status: 201, description: 'New token pair generated' })
  @ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout client and revoke session tokens' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Req() req: Request, @Body() body?: { refreshToken?: string }) {
    let jti: string | undefined;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = await this.authService.verifyAccessTokenSilently(token);
      jti = payload?.jti;
    }
    return this.authService.logout(jti, body?.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Fetch authenticated user profile and roles' })
  @ApiResponse({ status: 200, description: 'Current user profile details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser() user: { userId: string }) {
    return this.authService.getProfile(user.userId);
  }
}

