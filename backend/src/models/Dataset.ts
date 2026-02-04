import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

interface DatasetAttributes {
    id: number;
    name: string;
    s3Key: string;
    uploadedBy: number | null;
    rowCount: number | null;
    fileSize: number | null;
    createdAt?: Date;
}

interface DatasetCreationAttributes extends Optional<DatasetAttributes, 'id' | 'uploadedBy' | 'rowCount' | 'fileSize' | 'createdAt'> { }

export class Dataset extends Model<DatasetAttributes, DatasetCreationAttributes> implements DatasetAttributes {
    public id!: number;
    public name!: string;
    public s3Key!: string;
    public uploadedBy!: number | null;
    public rowCount!: number | null;
    public fileSize!: number | null;
    public readonly createdAt!: Date;
}

Dataset.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        s3Key: {
            type: DataTypes.STRING(500),
            allowNull: false,
            field: 's3_key'
        },
        uploadedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'uploaded_by',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        rowCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'row_count'
        },
        fileSize: {
            type: DataTypes.BIGINT,
            allowNull: true,
            field: 'file_size'
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at'
        }
    },
    {
        sequelize,
        tableName: 'datasets',
        timestamps: false,
        underscored: true
    }
);

// Associations
Dataset.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

export default Dataset;
