import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type UserRole = 'admin' | 'analyst' | 'viewer';

interface UserAttributes {
    id: number;
    email: string;
    passwordHash: string;
    role: UserRole;
    createdAt?: Date;
    updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public email!: string;
    public passwordHash!: string;
    public role!: UserRole;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        passwordHash: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'password_hash'
        },
        role: {
            type: DataTypes.ENUM('admin', 'analyst', 'viewer'),
            allowNull: false,
            defaultValue: 'viewer'
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at'
        }
    },
    {
        sequelize,
        tableName: 'users',
        timestamps: true,
        underscored: true
    }
);

export default User;
