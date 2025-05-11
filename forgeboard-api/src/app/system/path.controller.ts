import { Body, Controller, Post } from '@nestjs/common';
import { PathService } from './path.service';

class JoinPathsDto {
  paths: string[];
}

class ResolvePathsDto {
  paths: string[];
}

class BasenamDto {
  filePath: string;
  ext?: string;
}

class DirnamDto {
  filePath: string;
}

class ExtnamDto {
  filePath: string;
}

@Controller('api/path')
export class PathController {
  constructor(private readonly pathService: PathService) {}

  @Post('join')
  joinPaths(@Body() dto: JoinPathsDto): { path: string } {
    return { path: this.pathService.join(...dto.paths) };
  }

  @Post('resolve')
  resolvePaths(@Body() dto: ResolvePathsDto): { path: string } {
    return { path: this.pathService.resolve(...dto.paths) };
  }

  @Post('basename')
  basename(@Body() dto: BasenamDto): { basename: string } {
    return { basename: this.pathService.basename(dto.filePath, dto.ext) };
  }

  @Post('dirname')
  dirname(@Body() dto: DirnamDto): { dirname: string } {
    return { dirname: this.pathService.dirname(dto.filePath) };
  }

  @Post('extname')
  extname(@Body() dto: ExtnamDto): { extname: string } {
    return { extname: this.pathService.extname(dto.filePath) };
  }
}
