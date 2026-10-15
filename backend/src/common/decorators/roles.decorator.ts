import { SetMetadata } from '@nestjs/common';
import { UserType } from '../../database/enums';

export const ROLES_KEY = 'roles';
/**
 * Who may call. Every non-public route must declare this. A route with
 * neither @Public nor @Roles is rejected, so a forgotten decorator fails closed.
 */
export const Roles = (...roles: UserType[]) => SetMetadata(ROLES_KEY, roles);
