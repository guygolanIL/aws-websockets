import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { queries } from '../queries';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const mgmtClient = new ApiGatewayManagementApiClient({
    endpoint: process.env.WS_API_ENDPOINT,
});

type EventPayload = {
    event: 'user_connected';
    data: { connectedUsers: string[] };
} |
{
    event: 'user_disconnected';
    data: { connectedUsers: string[] };
} | {
    event: "user_presence_updated";
    data: {
        location: number;
    }
};

export async function notify(
    connections: string[],
    payload: EventPayload,
    options?: { onError?: (connectionId: string, error: unknown) => void }
) {
    return Promise.allSettled(
        connections.map(connectionId =>
            mgmtClient.send(
                new PostToConnectionCommand({
                    ConnectionId: connectionId,
                    Data: JSON.stringify(payload),
                })
            ).catch(error => {
                options?.onError?.(connectionId, error);
            })
        )
    );
}