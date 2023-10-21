import { DeleteItemCommand, DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResultV2, APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { notify } from "./util/notify";
import { queries } from "./queries";

const client = new DynamoDBClient();

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (e): Promise<APIGatewayProxyResultV2> => {
    console.log('Disconnect event', e.requestContext);

    const connectionId = e.requestContext.connectionId;

    const q = queries(client);
    await q.deleteConnection(connectionId);

    const connections = await q.fetchConnections();
    const otherConnections = connections.filter(id => id !== connectionId);

    await notify(otherConnections, {
        event: "user_disconnected",
        data: {
            connectedUsers: connections
        }
    });

    return { statusCode: 200 };
}; 