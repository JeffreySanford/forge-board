import { IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  username: string;
  
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}

export class TokenDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  username: string;
  
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
  
  @IsOptional()
  @IsString()
  email?: string;
}
