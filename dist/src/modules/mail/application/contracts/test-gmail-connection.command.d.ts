export type TestGmailConnectionCommand = {
    baseEmail: string;
    appPassword?: string;
    host: string;
    port: number;
    secure: boolean;
};
