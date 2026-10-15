import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** Skips authentication. Use sparingly: login, refresh, health. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
