import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AuthService } from './modules/auth/auth.service';

@Module({
  imports: [AuthModule],
  controllers: [AppController],
  providers: [AppService, AuthService],
})
export class AppModule {}
