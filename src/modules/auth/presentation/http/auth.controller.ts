import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../../../common/guards/jwt-auth.guard";
import { AuthService } from "../../services/auth.service";
import { LoginDto } from "./dto/login.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "Iniciar sesion como administrador" })
  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @ApiBearerAuth("bearerAuth")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Obtener el usuario autenticado" })
  @Get("me")
  me(@Req() request: Request) {
    return request.user;
  }
}
