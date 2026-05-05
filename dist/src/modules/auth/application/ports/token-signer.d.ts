export type AuthTokenPayload = {
    sub: string;
    email: string;
    role: "ADMIN";
};
export declare const TOKEN_SIGNER: unique symbol;
export interface TokenSigner {
    sign(payload: AuthTokenPayload): Promise<string>;
}
