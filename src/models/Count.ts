import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { getCurrentMonth, getCurrentYear } from '../utils/helpers';

class MonthlyTransactions {
  @prop({ required: true, default: getCurrentMonth() })
  public key!: number;

  @prop({ default: 0, required: true })
  public all!: number;

  @prop({ default: 0, required: true })
  public pending!: number;

  @prop({ default: 0, required: true })
  public successful!: number;

  @prop({ default: 0, required: true })
  public failed!: number;
}

class YearlyTransactions {
  @prop({ required: true, default: getCurrentYear() })
  public key!: number;

  @prop({ default: 0, required: true })
  public all!: number;

  @prop({ default: 0, required: true })
  public pending!: number;

  @prop({ default: 0, required: true })
  public successful!: number;

  @prop({ default: 0, required: true })
  public failed!: number;
}

class MonthlyRewards {
  @prop({ required: true, default: getCurrentMonth() })
  public key!: number;

  @prop({ default: 0, required: true })
  public all!: number;

  @prop({ default: 0, required: true })
  public pending!: number;

  @prop({ default: 0, required: true })
  public successful!: number;
}

class YearlyRewards {
  @prop({ required: true, default: getCurrentYear() })
  public key!: number;

  @prop({ default: 0, required: true })
  public all!: number;

  @prop({ default: 0, required: true })
  public pending!: number;

  @prop({ default: 0, required: true })
  public successful!: number;
}

class MonthlyUsers {
  @prop({ required: true, default: getCurrentMonth() })
  public key!: number;

  @prop({ default: 0, required: true })
  public active!: number;

  @prop({ default: 0, required: true })
  public inactive!: number;

  @prop({ default: 0, required: true })
  public all!: number;
}

class YearlyUsers {
  @prop({ required: true, default: getCurrentYear() })
  public key!: number;

  @prop({ default: 0, required: true })
  public active!: number;

  @prop({ default: 0, required: true })
  public inactive!: number;

  @prop({ default: 0, required: true })
  public all!: number;
}

class Users {
  @prop({ default: 0, required: true })
  public all!: number;

  @prop({ default: 0, required: true })
  public active!: number;

  @prop({ default: 0, required: true })
  public inactive!: number;

  @prop({
    type: () => MonthlyUsers,
    _id: false,
    default: () => new MonthlyUsers(),
  })
  public month!: MonthlyUsers;

  @prop({
    type: () => YearlyUsers,
    _id: false,
    default: () => new YearlyUsers(),
  })
  public year!: YearlyUsers;
}

class Transactions {
  @prop({ default: 0, required: true })
  public all!: number;

  @prop({ default: 0, required: true })
  public pending!: number;

  @prop({ default: 0, required: true })
  public successful!: number;

  @prop({ default: 0, required: true })
  public failed!: number;

  @prop({
    type: () => MonthlyTransactions,
    _id: false,
    default: () => new MonthlyTransactions(),
  })
  public month!: MonthlyTransactions;

  @prop({
    type: () => YearlyTransactions,
    _id: false,
    default: () => new YearlyTransactions(),
  })
  public year!: YearlyTransactions;
}

class Rewards {
  @prop({ default: 0, required: true })
  public all!: number;

  @prop({ default: 0, required: true })
  public pending!: number;

  @prop({ default: 0, required: true })
  public successful!: number;

  @prop({
    type: () => MonthlyRewards,
    _id: false,
    default: () => new MonthlyRewards(),
  })
  public month!: MonthlyRewards;

  @prop({
    type: () => YearlyRewards,
    _id: false,
    default: () => new YearlyRewards(),
  })
  public year!: YearlyRewards;
}

class YearlyRevenue {
  @prop({ required: true, default: getCurrentYear() })
  public key!: number;

  @prop({ default: 0, required: true })
  public revenue!: number;
}

class MonthlyRevenue {
  @prop({ required: true, default: getCurrentMonth() })
  public key!: number;

  @prop({ default: 0, required: true })
  public revenue!: number;
}

class Revenue {
  @prop({ default: 0, required: true })
  public all!: number;

  @prop({
    type: () => MonthlyRevenue,
    _id: false,
    default: () => new MonthlyRevenue(),
  })
  public month!: MonthlyRevenue;

  @prop({
    type: () => YearlyRevenue,
    _id: false,
    default: () => new YearlyRevenue(),
  })
  public year!: YearlyRevenue;
}

@modelOptions({ schemaOptions: { timestamps: true } })
export class Count {
  @prop({ type: () => Users, _id: false, default: () => new Users() })
  public users!: Users;

  @prop({
    type: () => Transactions,
    _id: false,
    default: () => new Transactions(),
  })
  public transactions!: Transactions;

  @prop({ type: () => Rewards, _id: false, default: () => new Rewards() })
  public rewards!: Rewards;

  @prop({ type: () => Revenue, _id: false, default: () => new Revenue() })
  public revenue!: Revenue;
}

export const CountModel = getModelForClass(Count);
