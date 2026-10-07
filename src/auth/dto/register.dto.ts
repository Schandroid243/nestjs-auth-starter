import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail(
    {},
    {
      message: "Format de l'email invalide",
    },
  )
  @IsNotEmpty({ message: "L'email est requis." })
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  })
  password: string;
}
