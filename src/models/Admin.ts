import { prop, getModelForClass } from '@typegoose/typegoose';
import { RoleType } from '../types';
import { Role } from '../schemas/admin';

export class Admin {
  @prop({ required: true, unique: true })
  public email!: string;

  @prop()
  public password?: string;

  @prop({ required: true })
  public name!: string;

  @prop({ default: Role.ADMIN, enum: Role })
  public role!: RoleType;

  @prop()
  public invitationToken?: string;

  @prop()
  public invitationExpires?: Date;

  @prop({ required: true, default: false })
  public isActive!: boolean;

  @prop()
  public refreshToken?: string;
}

export const AdminModel = getModelForClass(Admin, {
  schemaOptions: {
    timestamps: true,
  },
});
