import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Dataset } from './Dataset';
import { User } from './User';

export type ModelType = 'baseline' | 'arima' | 'xgboost';
export type ForecastStatus = 'pending' | 'running' | 'completed' | 'failed';
export type Granularity = 'daily' | 'weekly' | 'monthly';

interface ForecastAttributes {
    id: number;
    datasetId: number;
    userId: number | null;
    modelType: ModelType;
    horizon: number;
    granularity: Granularity;
    status: ForecastStatus;
    resultsJson: any | null;
    metricsJson: any | null;
    errorMessage: string | null;
    createdAt?: Date;
    completedAt?: Date | null;
}

interface ForecastCreationAttributes extends Optional<ForecastAttributes, 'id' | 'userId' | 'status' | 'resultsJson' | 'metricsJson' | 'errorMessage' | 'createdAt' | 'completedAt'> { }

export class Forecast extends Model<ForecastAttributes, ForecastCreationAttributes> implements ForecastAttributes {
    public id!: number;
    public datasetId!: number;
    public userId!: number | null;
    public modelType!: ModelType;
    public horizon!: number;
    public granularity!: Granularity;
    public status!: ForecastStatus;
    public resultsJson!: any | null;
    public metricsJson!: any | null;
    public errorMessage!: string | null;
    public readonly createdAt!: Date;
    public completedAt!: Date | null;
}

Forecast.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        datasetId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'dataset_id',
            references: {
                model: 'datasets',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        modelType: {
            type: DataTypes.ENUM('baseline', 'arima', 'xgboost'),
            allowNull: false,
            field: 'model_type'
        },
        horizon: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        granularity: {
            type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'running', 'completed', 'failed'),
            allowNull: false,
            defaultValue: 'pending'
        },
        resultsJson: {
            type: DataTypes.JSONB,
            allowNull: true,
            field: 'results_json'
        },
        metricsJson: {
            type: DataTypes.JSONB,
            allowNull: true,
            field: 'metrics_json'
        },
        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'error_message'
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at'
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'completed_at'
        }
    },
    {
        sequelize,
        tableName: 'forecasts',
        timestamps: false,
        underscored: true
    }
);

// Associations
Forecast.belongsTo(Dataset, { foreignKey: 'datasetId', as: 'dataset' });
Forecast.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Forecast;
