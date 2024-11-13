import { info } from 'autoprefixer';
import { db } from '~/api/db/database';
import type { Role, Permission } from '~/types/models/auth';
import { hashPassword } from '~/utils/auth';

export class InitDataService {
  // 初始化系统权限
  static async initializePermissions(): Promise<number[]> {
    const defaultPermissions: Omit<Permission, 'id'>[] = [
      // 患者管理权限
      {
        name: '查看患者列表',
        code: 'patients.view',
        resource: 'patients',
        action: 'read',
        type: 'menu',
        status: 'active',
        description: '允许查看患者列表和基本信息'
      },
      {
        name: '创建患者档案',
        code: 'patients.create',
        resource: 'patients',
        action: 'create',
        type: 'operation',
        status: 'active',
        description: '允许创建新的患者档案'
      },
      {
        name: '编辑患者信息',
        code: 'patients.edit',
        resource: 'patients',
        action: 'update',
        type: 'operation',
        status: 'active',
        description: '允许修改患者基本信息'
      },

      // 病历管理权限
      {
        name: '查看病历',
        code: 'medical_records.view',
        resource: 'medical_records',
        action: 'read',
        type: 'menu',
        status: 'active',
        description: '允许查看患者病历'
      },
      {
        name: '创建病历',
        code: 'medical_records.create',
        resource: 'medical_records',
        action: 'create',
        type: 'operation',
        status: 'active',
        description: '允许创建新的病历记录'
      },
      {
        name: '编辑病历',
        code: 'medical_records.edit',
        resource: 'medical_records',
        action: 'update',
        type: 'operation',
        status: 'active',
        description: '允许修改病历内容'
      },

      // 处方管理权限
      {
        name: '查看处方',
        code: 'prescriptions.view',
        resource: 'prescriptions',
        action: 'read',
        type: 'menu',
        status: 'active',
        description: '允许查看处方信息'
      },
      {
        name: '开具处方',
        code: 'prescriptions.create',
        resource: 'prescriptions',
        action: 'create',
        type: 'operation',
        status: 'active',
        description: '允许开具新处方'
      },

      // 预约管理权限
      {
        name: '查看预约',
        code: 'appointments.view',
        resource: 'appointments',
        action: 'read',
        type: 'menu',
        status: 'active',
        description: '允许查看预约信息'
      },
      {
        name: '创建预约',
        code: 'appointments.create',
        resource: 'appointments',
        action: 'create',
        type: 'operation',
        status: 'active',
        description: '允许创建新预约'
      }
    ];

    // 批量插入权限并返回生成的ID数组
    const permissionIds = await db.transaction(
      'rw',
      db.permissions,
      async () => {
        return await db.permissions.bulkAdd(
          defaultPermissions as Permission[],
          {
            allKeys: true
          }
        );
      }
    );

    return permissionIds;
  }

  // 初始化系统角色
  static async initializeRoles(permissionIds: number[]): Promise<number[]> {
    const defaultRoles: Omit<Role, 'id'>[] = [
      {
        name: '系统管理员',
        code: 'admin',
        description: '系统最高权限管理员',
        level: 0,
        status: 'active',
        permissionIds: permissionIds, // 管理员拥有所有权限ID
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '主治医师',
        code: 'doctor',
        description: '主治医师角色',
        level: 1,
        status: 'active',
        permissionIds: permissionIds.slice(0, 6), // 示例：分配前6个权限
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '护士',
        code: 'nurse',
        description: '护士角色',
        level: 2,
        status: 'active',
        permissionIds: permissionIds.filter(
          (p) =>
            ['patients', 'appointments'].includes(p.resource) &&
            ['read', 'create'].includes(p.action)
        ),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '药剂师',
        code: 'pharmacist',
        description: '药剂师角色',
        level: 2,
        status: 'active',
        permissionIds: permissionIds.filter(
          (p) =>
            p.resource === 'prescriptions' &&
            ['read', 'update'].includes(p.action)
        ),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    const allRoleIds = await db.transaction('rw', db.roles, async () => {
      return await db.roles.bulkAdd(defaultRoles as Role[], {
        allKeys: true
      });
    });

    return allRoleIds;
  }

  // 初始化默认用户角色
  static async initializeUserRoles(): Promise<void> {
    const defaultUserRoles = [
      {
        userId: 1, // 假设 ID 为 1 的用户是管理员
        roleId: 1,
        createdAt: new Date(),
        updatedBy: 1
      }
    ];
  }

  // 执行完整的初始化
  static async initialize(): Promise<void> {
    try {
      // 检查是否已初始化
      const existingUsers = await db.users.count();
      if (existingUsers > 0) {
        return;
      }

      // 初始化权限
      const permissionIds = await this.initializePermissions();

      // 初始化角色
      const roleIds = await this.initializeRoles(permissionIds);

      // 初始化管理员用户
      await this.initializeAdminUser(roleIds);
    } catch (error) {
      console.error('Failed to initialize system:', error);
      throw error;
    }
  }

  // 初始化管理员用户
  private static async initializeAdminUser(roleIds: number[]): Promise<void> {
    const adminUser = {
      username: 'admin',
      password: await hashPassword('admin123'), // 实现密码加密
      name: '系统管理员',
      roleIds: roleIds, // 分配所有角色
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.users.add(adminUser);
  }
}
