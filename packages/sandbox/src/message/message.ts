import { z } from "zod";

/**
 * Message types and schemas based on OpenCode SDK
 * Reference: packages/sandbox/src/sdk/opencode/messages.ts
 */
export namespace Message {
    // ============= Base Types =============

    export const FileDiffSchema = z.object({
        file: z.string(),
        before: z.string(),
        after: z.string(),
        additions: z.number(),
        deletions: z.number()
    }).meta({ ref: "FileDiff" });
    export type FileDiff = z.infer<typeof FileDiffSchema>;

    export const ModelSchema = z.object({
        providerID: z.string(),
        modelID: z.string()
    }).meta({ ref: "Model" });
    export type Model = z.infer<typeof ModelSchema>;

    export const TimeCreatedSchema = z.object({
        created: z.number()
    }).meta({ ref: "TimeCreated" });
    export type TimeCreated = z.infer<typeof TimeCreatedSchema>;

    export const TimeCompletedSchema = z.object({
        created: z.number(),
        completed: z.number().optional()
    }).meta({ ref: "TimeCompleted" });
    export type TimeCompleted = z.infer<typeof TimeCompletedSchema>;

    // ============= Error Types =============

    export const ProviderAuthErrorSchema = z.object({
        name: z.literal("ProviderAuthError"),
        data: z.object({
            providerID: z.string(),
            message: z.string()
        })
    }).meta({ ref: "ProviderAuthError" });
    export type ProviderAuthError = z.infer<typeof ProviderAuthErrorSchema>;

    export const UnknownErrorSchema = z.object({
        name: z.literal("UnknownError"),
        data: z.object({
            message: z.string()
        })
    }).meta({ ref: "UnknownError" });
    export type UnknownError = z.infer<typeof UnknownErrorSchema>;

    export const MessageOutputLengthErrorSchema = z.object({
        name: z.literal("MessageOutputLengthError"),
        data: z.record(z.string(), z.unknown())
    }).meta({ ref: "MessageOutputLengthError" });
    export type MessageOutputLengthError = z.infer<typeof MessageOutputLengthErrorSchema>;

    export const MessageAbortedErrorSchema = z.object({
        name: z.literal("MessageAbortedError"),
        data: z.object({
            message: z.string()
        })
    }).meta({ ref: "MessageAbortedError" });
    export type MessageAbortedError = z.infer<typeof MessageAbortedErrorSchema>;

    export const ApiErrorSchema = z.object({
        name: z.literal("APIError"),
        data: z.object({
            message: z.string(),
            statusCode: z.number().optional(),
            isRetryable: z.boolean(),
            responseHeaders: z.record(z.string(), z.string()).optional(),
            responseBody: z.string().optional()
        })
    }).meta({ ref: "ApiError" });
    export type ApiError = z.infer<typeof ApiErrorSchema>;

    export const MessageErrorSchema = z.union([
        ProviderAuthErrorSchema,
        UnknownErrorSchema,
        MessageOutputLengthErrorSchema,
        MessageAbortedErrorSchema,
        ApiErrorSchema
    ]);
    export type MessageError = z.infer<typeof MessageErrorSchema>;

    // ============= Message Info Types =============

    export const UserMessageSchema = z.object({
        id: z.string(),
        sessionID: z.string(),
        role: z.literal("user"),
        time: TimeCreatedSchema,
        summary: z.object({
            title: z.string().optional(),
            body: z.string().optional(),
            diffs: z.array(FileDiffSchema)
        }).optional(),
        agent: z.string(),
        model: ModelSchema,
        system: z.string().optional(),
        tools: z.record(z.string(), z.boolean()).optional()
    }).meta({ ref: "UserMessage" });
    export type UserMessage = z.infer<typeof UserMessageSchema>;

    export const AssistantMessageSchema = z.object({
        id: z.string(),
        sessionID: z.string(),
        role: z.literal("assistant"),
        time: TimeCompletedSchema,
        error: MessageErrorSchema.optional(),
        parentID: z.string(),
        modelID: z.string(),
        providerID: z.string(),
        mode: z.string(),
        path: z.object({
            cwd: z.string(),
            root: z.string()
        }),
        summary: z.boolean().optional(),
        cost: z.number(),
        tokens: z.object({
            input: z.number(),
            output: z.number(),
            reasoning: z.number(),
            cache: z.object({
                read: z.number(),
                write: z.number()
            })
        }),
        finish: z.string().optional()
    }).meta({ ref: "AssistantMessage" });
    export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;

    export const MessageInfoSchema = z.discriminatedUnion("role", [
        UserMessageSchema,
        AssistantMessageSchema
    ]);
    export type MessageInfo = z.infer<typeof MessageInfoSchema>;

    // ============= Part Types =============

    export const TextPartSchema = z.object({
        id: z.string(),
        sessionID: z.string(),
        messageID: z.string(),
        type: z.literal("text"),
        text: z.string(),
        synthetic: z.boolean().optional(),
        ignored: z.boolean().optional(),
        time: z.object({
            start: z.number(),
            end: z.number().optional()
        }).optional(),
        metadata: z.record(z.string(), z.unknown()).optional()
    }).meta({ ref: "TextPart" });
    export type TextPart = z.infer<typeof TextPartSchema>;

    export const ReasoningPartSchema = z.object({
        id: z.string(),
        sessionID: z.string(),
        messageID: z.string(),
        type: z.literal("reasoning"),
        text: z.string(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        time: z.object({
            start: z.number(),
            end: z.number().optional()
        })
    }).meta({ ref: "ReasoningPart" });
    export type ReasoningPart = z.infer<typeof ReasoningPartSchema>;

    export const RangeSchema = z.object({
        start: z.object({
            line: z.number(),
            character: z.number()
        }),
        end: z.object({
            line: z.number(),
            character: z.number()
        })
    }).meta({ ref: "Range" });
    export type Range = z.infer<typeof RangeSchema>;

    export const FilePartSourceTextSchema = z.object({
        value: z.string(),
        start: z.number(),
        end: z.number()
    }).meta({ ref: "FilePartSourceText" });
    export type FilePartSourceText = z.infer<typeof FilePartSourceTextSchema>;

    export const FileSourceSchema = z.object({
        type: z.literal("file"),
        text: FilePartSourceTextSchema,
        path: z.string()
    }).meta({ ref: "FileSource" });
    export type FileSource = z.infer<typeof FileSourceSchema>;

    export const SymbolSourceSchema = z.object({
        type: z.literal("symbol"),
        text: FilePartSourceTextSchema,
        path: z.string(),
        range: RangeSchema,
        name: z.string(),
        kind: z.number()
    }).meta({ ref: "SymbolSource" });
    export type SymbolSource = z.infer<typeof SymbolSourceSchema>;

    export const FilePartSourceSchema = z.discriminatedUnion("type", [
        FileSourceSchema,
        SymbolSourceSchema
    ]);
    export type FilePartSource = z.infer<typeof FilePartSourceSchema>;

    export const FilePartSchema = z.object({
        id: z.string(),
        sessionID: z.string(),
        messageID: z.string(),
        type: z.literal("file"),
        mime: z.string(),
        filename: z.string().optional(),
        url: z.string(),
        source: FilePartSourceSchema.optional()
    }).meta({ ref: "FilePart" });
    export type FilePart = z.infer<typeof FilePartSchema>;

    export const ToolStatePendingSchema = z.object({
        status: z.literal("pending"),
        input: z.record(z.string(), z.unknown()),
        raw: z.string()
    }).meta({ ref: "ToolStatePending" });
    export type ToolStatePending = z.infer<typeof ToolStatePendingSchema>;

    export const ToolStateRunningSchema = z.object({
        status: z.literal("running"),
        input: z.record(z.string(), z.unknown()),
        title: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        time: z.object({
            start: z.number()
        })
    }).meta({ ref: "ToolStateRunning" });
    export type ToolStateRunning = z.infer<typeof ToolStateRunningSchema>;

    export const ToolStateCompletedSchema = z.object({
        status: z.literal("completed"),
        input: z.record(z.string(), z.unknown()),
        output: z.string(),
        title: z.string(),
        metadata: z.record(z.string(), z.unknown()),
        time: z.object({
            start: z.number(),
            end: z.number(),
            compacted: z.number().optional()
        }),
        attachments: z.array(FilePartSchema).optional()
    }).meta({ ref: "ToolStateCompleted" });
    export type ToolStateCompleted = z.infer<typeof ToolStateCompletedSchema>;

    export const ToolStateErrorSchema = z.object({
        status: z.literal("error"),
        input: z.record(z.string(), z.unknown()),
        error: z.string(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        time: z.object({
            start: z.number(),
            end: z.number()
        })
    }).meta({ ref: "ToolStateError" });
    export type ToolStateError = z.infer<typeof ToolStateErrorSchema>;

    export const ToolStateSchema = z.discriminatedUnion("status", [
        ToolStatePendingSchema,
        ToolStateRunningSchema,
        ToolStateCompletedSchema,
        ToolStateErrorSchema
    ]);
    export type ToolState = z.infer<typeof ToolStateSchema>;

    export const ToolPartSchema = z.object({
        id: z.string(),
        sessionID: z.string(),
        messageID: z.string(),
        type: z.literal("tool"),
        callID: z.string(),
        tool: z.string(),
        state: ToolStateSchema,
        metadata: z.record(z.string(), z.unknown()).optional()
    }).meta({ ref: "ToolPart" });
    export type ToolPart = z.infer<typeof ToolPartSchema>;

    export const StepStartPartSchema = z.object({
        id: z.string(),
        sessionID: z.string(),
        messageID: z.string(),
        type: z.literal("step-start"),
        snapshot: z.string().optional()
    }).meta({ ref: "StepStartPart" });
    export type StepStartPart = z.infer<typeof StepStartPartSchema>;

    export const StepFinishPartSchema = z.object({
        id: z.string(),
        sessionID: z.string(),
        messageID: z.string(),
        type: z.literal("step-finish"),
        reason: z.string(),
        snapshot: z.string().optional(),
        cost: z.number(),
        tokens: z.object({
            input: z.number(),
            output: z.number(),
            reasoning: z.number(),
            cache: z.object({
                read: z.number(),
                write: z.number()
            })
        })
    }).meta({ ref: "StepFinishPart" });
    export type StepFinishPart = z.infer<typeof StepFinishPartSchema>;

    export const SnapshotPartSchema = z.object({
        id: z.string(),
        sessionID: z.string(),
        messageID: z.string(),
        type: z.literal("snapshot"),
        snapshot: z.string()
    }).meta({
        ref: "SnapshotPart",
    })
    export type SnapshotPart = z.infer<typeof SnapshotPartSchema>;

    export const PatchPartSchema = z.object({
        id: z.string(),
        sessionID: z.string(),
        messageID: z.string(),
        type: z.literal("patch"),
        hash: z.string(),
        files: z.array(z.string())
    }).meta({ ref: "PatchPart" });
    export type PatchPart = z.infer<typeof PatchPartSchema>;

    export const AgentPartSchema = z.object({
        id: z.string(),
        sessionID: z.string(),
        messageID: z.string(),
        type: z.literal("agent"),
        name: z.string(),
        source: z.object({
            value: z.string(),
            start: z.number(),
            end: z.number()
        }).optional()
    }).meta({ ref: "AgentPart" });
    export type AgentPart = z.infer<typeof AgentPartSchema>;

    export const SubtaskPartSchema = z.object({
        id: z.string(),
        sessionID: z.string(),
        messageID: z.string(),
        type: z.literal("subtask"),
        prompt: z.string(),
        description: z.string(),
        agent: z.string()
    }).meta({ ref: "SubtaskPart" });
    export type SubtaskPart = z.infer<typeof SubtaskPartSchema>;

    export const RetryPartSchema = z.object({
        id: z.string(),
        sessionID: z.string(),
        messageID: z.string(),
        type: z.literal("retry"),
        attempt: z.number(),
        error: ApiErrorSchema,
        time: z.object({
            created: z.number()
        })
    }).meta({ ref: "RetryPart" });
    export type RetryPart = z.infer<typeof RetryPartSchema>;

    export const CompactionPartSchema = z.object({
        id: z.string(),
        sessionID: z.string(),
        messageID: z.string(),
        type: z.literal("compaction")
    }).meta({ ref: "CompactionPart" });
    export type CompactionPart = z.infer<typeof CompactionPartSchema>;

    export const PartSchema = z.discriminatedUnion("type", [
        TextPartSchema,
        ReasoningPartSchema,
        FilePartSchema,
        ToolPartSchema,
        StepStartPartSchema,
        StepFinishPartSchema,
        SnapshotPartSchema,
        PatchPartSchema,
        AgentPartSchema,
        SubtaskPartSchema,
        RetryPartSchema,
        CompactionPartSchema
    ]);
    export type Part = z.infer<typeof PartSchema>;

    // ============= Complete Message Type =============

    export const MessageWithPartsSchema = z.object({
        info: MessageInfoSchema,
        parts: z.array(PartSchema)
    }).meta({ ref: "MessageWithParts" });
    export type MessageWithParts = z.infer<typeof MessageWithPartsSchema>;

    export const MessagesResponseSchema = z.array(MessageWithPartsSchema);
    export type MessagesResponse = z.infer<typeof MessagesResponseSchema>;
}
