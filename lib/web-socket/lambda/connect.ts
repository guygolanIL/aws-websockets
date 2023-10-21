import { DynamoDBClient, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResultV2, APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { notify } from "./util/notify";
import { queries } from "./queries";

const client = new DynamoDBClient();

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (e): Promise<APIGatewayProxyResultV2> => {
    console.log('Connect event', e.requestContext);

    const connectionId = e.requestContext.connectionId;

    await client.send(
        new PutItemCommand({
            TableName: process.env.PRESENCE_TABLE,
            Item: {
                PK: { S: 'presence' },
                SK: { S: connectionId },
            },
        }),
    );

    const q = queries(client);
    const connections = await q.fetchConnections();
    const otherConnections = connections.filter(id => id !== connectionId);

    await notify(otherConnections, {
        event: "user_connected",
        data: {
            connectedUsers: connections,
        },
    }, {
        onError(connectionId, error) {
            console.log(error);
            q.deleteConnection(connectionId);
        },
    });

    return { statusCode: 200 };
}; 