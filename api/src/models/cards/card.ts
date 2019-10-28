export interface Card {
  cardId?: string;
  accountId?: string;
  cardNumber: number;
  cardExpiration?: Date;
  cardCvv?: number;
  issueDate: Date;
}
