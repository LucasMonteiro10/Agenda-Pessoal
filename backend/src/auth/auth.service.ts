import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto.js';
import { RegistrarDto } from './dto/registrar.dto.js';
import { Usuario } from './entities/usuario.entity.js';

const CUSTO_HASH_SENHA = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  async registrar({ nomeCompleto, email, senha }: RegistrarDto) {
    const jaExiste = await this.usuarios.findOne({ where: { email } });
    if (jaExiste) {
      throw new ConflictException('Já existe uma conta com esse email');
    }

    const senhaHash = await bcrypt.hash(senha, CUSTO_HASH_SENHA);
    const usuario = await this.usuarios.save(this.usuarios.create({ nomeCompleto, email, senhaHash }));

    return { id: usuario.id, nomeCompleto: usuario.nomeCompleto, email: usuario.email };
  }

  async login({ email, senha }: LoginDto) {
    const usuario = await this.usuarios.findOne({ where: { email } });

    // Mesma mensagem/erro tanto para "conta não existe" quanto para "senha
    // errada" — não revelar qual dos dois campos estava incorreto.
    const credenciaisInvalidas = new UnauthorizedException('Email ou senha incorretos');

    if (!usuario) {
      throw credenciaisInvalidas;
    }

    const senhaConfere = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaConfere) {
      throw credenciaisInvalidas;
    }

    const accessToken = await this.jwtService.signAsync({ sub: usuario.id, email: usuario.email });
    return { accessToken };
  }
}
