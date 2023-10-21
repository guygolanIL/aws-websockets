import { Construct } from "constructs";
import * as cdk from 'aws-cdk-lib';
import { WebSocketApi, WebSocketStage } from "@aws-cdk/aws-apigatewayv2-alpha";
import { WebSocketLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { join } from 'path';

export class WebSocketBackend extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const presenceTable = new cdk.aws_dynamodb.Table(scope, "PresenceTable", {
      partitionKey: {
        name: "PK",
        type: cdk.aws_dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "SK",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const connectFunction = new cdk.aws_lambda_nodejs.NodejsFunction(scope, 'ConnectFn', {
      entry: join(__dirname, 'lambda', "connect.ts"),
      environment: {
        PRESENCE_TABLE: presenceTable.tableName,
      }
    });
    presenceTable.grantReadWriteData(connectFunction);

    const disconnectFunction = new cdk.aws_lambda_nodejs.NodejsFunction(scope, "DisconnecFn", {
      entry: join(__dirname, 'lambda', 'disconnect.ts'),
      environment: {
        PRESENCE_TABLE: presenceTable.tableName,
      }
    });
    presenceTable.grantReadWriteData(disconnectFunction);

    const presenceUpdateFunction = new cdk.aws_lambda_nodejs.NodejsFunction(scope, "PresenceUpdateFn", {
      entry: join(__dirname, 'lambda', 'presenceUpdate.ts'),
      environment: {
        PRESENCE_TABLE: presenceTable.tableName,
      }
    });
    presenceTable.grantReadWriteData(presenceUpdateFunction);

    const webSocketApi = new WebSocketApi(scope, "WebSocketApi", {
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration('ConnectIntegration', connectFunction),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration("DisconnectIntegration", disconnectFunction),
      },
    });

    webSocketApi.addRoute("presenceUpdate", {
      integration: new WebSocketLambdaIntegration("PresenceUpdateIntegration", presenceUpdateFunction),
    });

    const webSocketStage = new WebSocketStage(scope, "WsStage", {
      stageName: "dev",
      webSocketApi,
      autoDeploy: true,
    });

    webSocketApi.grantManageConnections(connectFunction);
    webSocketApi.grantManageConnections(disconnectFunction);
    webSocketApi.grantManageConnections(presenceUpdateFunction);

    const WS_API_ENDPOINT = `https://${webSocketApi.apiId}.execute-api.${cdk.Stack.of(scope).region}.amazonaws.com/${webSocketStage.stageName}`;
    connectFunction.addEnvironment("WS_API_ENDPOINT", WS_API_ENDPOINT);
    disconnectFunction.addEnvironment("WS_API_ENDPOINT", WS_API_ENDPOINT);
    presenceUpdateFunction.addEnvironment("WS_API_ENDPOINT", WS_API_ENDPOINT);
  }
}