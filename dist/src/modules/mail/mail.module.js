"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailModule = void 0;
const common_1 = require("@nestjs/common");
const llm_config_module_1 = require("../llm-config/llm-config.module");
const generate_incident_summary_use_case_1 = require("./application/use-cases/generate-incident-summary.use-case");
const notifications_module_1 = require("../../notifications/notifications.module");
const mail_inbox_port_1 = require("./application/ports/mail-inbox.port");
const get_gmail_config_use_case_1 = require("./application/use-cases/get-gmail-config.use-case");
const get_message_summary_use_case_1 = require("./application/use-cases/get-message-summary.use-case");
const list_approved_messages_use_case_1 = require("./application/use-cases/list-approved-messages.use-case");
const list_classified_messages_use_case_1 = require("./application/use-cases/list-classified-messages.use-case");
const save_gmail_config_use_case_1 = require("./application/use-cases/save-gmail-config.use-case");
const sync_gmail_inbox_use_case_1 = require("./application/use-cases/sync-gmail-inbox.use-case");
const test_gmail_connection_use_case_1 = require("./application/use-cases/test-gmail-connection.use-case");
const email_classification_service_1 = require("./domain/services/email-classification.service");
const spam_filter_service_1 = require("./domain/services/spam-filter.service");
const gmail_inbox_adapter_1 = require("./infrastructure/adapters/gmail-inbox.adapter");
const gmail_service_1 = require("./infrastructure/services/gmail.service");
const gmail_controller_1 = require("./presentation/http/gmail.controller");
let MailModule = class MailModule {
};
exports.MailModule = MailModule;
exports.MailModule = MailModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule, llm_config_module_1.LlmConfigModule],
        controllers: [gmail_controller_1.GmailController],
        providers: [
            gmail_service_1.GmailService,
            spam_filter_service_1.SpamFilterService,
            email_classification_service_1.EmailClassificationService,
            gmail_inbox_adapter_1.GmailInboxAdapter,
            get_gmail_config_use_case_1.GetGmailConfigUseCase,
            get_message_summary_use_case_1.GetMessageSummaryUseCase,
            generate_incident_summary_use_case_1.GenerateIncidentSummaryUseCase,
            save_gmail_config_use_case_1.SaveGmailConfigUseCase,
            test_gmail_connection_use_case_1.TestGmailConnectionUseCase,
            list_approved_messages_use_case_1.ListApprovedMessagesUseCase,
            list_classified_messages_use_case_1.ListClassifiedMessagesUseCase,
            sync_gmail_inbox_use_case_1.SyncGmailInboxUseCase,
            {
                provide: mail_inbox_port_1.MAIL_INBOX_PORT,
                useExisting: gmail_inbox_adapter_1.GmailInboxAdapter
            }
        ]
    })
], MailModule);
//# sourceMappingURL=mail.module.js.map