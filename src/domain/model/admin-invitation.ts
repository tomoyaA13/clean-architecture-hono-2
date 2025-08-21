// src/domain/model/admin-invitation.ts
export interface AdminInvitationProps {
  id: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date | null;
}

export class AdminInvitation {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly usedAt?: Date | null
  ) {}

  static create(props: Omit<AdminInvitationProps, 'createdAt' | 'usedAt'>): AdminInvitation {
    return new AdminInvitation(
      props.id,
      props.email,
      props.token,
      props.expiresAt,
      new Date(),
      null
    );
  }

  static reconstruct(props: AdminInvitationProps): AdminInvitation {
    return new AdminInvitation(
      props.id,
      props.email,
      props.token,
      props.expiresAt,
      props.createdAt,
      props.usedAt
    );
  }

  markAsUsed(): AdminInvitation {
    return new AdminInvitation(
      this.id,
      this.email,
      this.token,
      this.expiresAt,
      this.createdAt,
      new Date()
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isUsed(): boolean {
    return this.usedAt !== null && this.usedAt !== undefined;
  }
}
