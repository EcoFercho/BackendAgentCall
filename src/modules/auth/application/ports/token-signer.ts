export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: "ADMIN";
};

export const TOKEN_SIGNER = Symbol("TOKEN_SIGNER");

export interface TokenSigner {
  sign(payload: AuthTokenPayload): Promise<string>;
}
