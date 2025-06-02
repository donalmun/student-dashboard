import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Thêm dòng này
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Cho phép sử dụng ConfigService ở mọi nơi mà không cần import lại
      envFilePath: '.env', // Đường dẫn file env, mặc định là .env
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
