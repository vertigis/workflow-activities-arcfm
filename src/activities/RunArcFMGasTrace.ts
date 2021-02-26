import type {
    IActivityContext,
    IActivityHandler,
} from "@geocortex/workflow/runtime/IActivityHandler";
import { ChannelProvider } from "@geocortex/workflow/runtime/activities/core/ChannelProvider";
import { activate } from "@geocortex/workflow/runtime/Hooks";

/** An interface that defines the inputs of the activity. */
export interface RunArcFMGasTraceInputs {
    /**
     * @displayName Service URL
     * @description The URL to the ArcGIS REST service. For example, http://server/arcgis/rest/services/<serviceName>/MapServer. The service must support the ArcFMMapServer extension.
     * @required
     */
    serviceUrl: string;

    /**
     * @description The start point of the trace.
     * @required
     */
    startPoint?: {
        x: number;
        y: number;
        spatialReference?: {
            wkid?: number;
            wkt?: string;
        };
    };

    /**
     * @description The type of trace to perform. The default is ValveIsolation.
     */
    traceType?:
        | "ValveIsolation"
        | "System"
        | "PressureSystem"
        | "CathodicProtection"
        | string;

    /**
     * @description The devices that act as barriers to the Valve Isolation trace. The default is AllValves.
     */
    isolationTraceBarriers?: "AllValves" | "CriticalValves" | string;

    /**
     * @description One or more EID values indicating the valves that must be excluded from the trace. Used only by the Valve Isolation trace.
     */
    excludedValves?: number | number[];

    /**
     * @description One or more EID values indicating the valves that may be included in the trace. Used only by the Valve Isolation trace.
     */
    includedValves?: number | number[];

    /**
     * @description One or more EID values indicating the valves that act as squeeze off points. Used only by the Valve Isolation trace.
     */
    squeezeOffs?: number | number[];

    /**
     * @description One or more EID values indicating the devices that act as temporary sources. Used only by the Valve Isolation trace.
     */
    temporarySources?: number | number[];

    /**
     * @description One or more EID values indicating the devices that act as barriers to the Pressure System trace. Used only by the Pressure System trace.
     */
    pressureSystemTraceBarriers?:
        | "AllRegulators"
        | "RegulatorsWithDifferentOutletPressures"
        | string;

    /**
     * @description One or more EID values indicating the devices that act as barriers to the System trace. Used only by the System trace.
     */
    systemTraceBarriers?: "TownBorderStations" | "Regulators" | string;

    /**
     * @description Whether the trace should draw complex edges. The default is false.
     */
    drawComplexEdges?: boolean;

    /**
     * @description Whether the user has identified edges to be included in the trace. The default is true.
     */
    includeEdges?: boolean;

    /**
     * @description Whether the user has identified junctions to be included in the trace. The default is true.
     */
    includeJunctions?: boolean;

    /**
     * @description Whether to include attribute values in the trace results. The default is false.
     */
    returnAttributes?: boolean;

    /**
     * @description Whether to include feature geometries in the trace results. The default is true.
     */
    returnGeometries?: boolean;

    /**
     * @description A numerical value indicating the search tolerance for the trace in map units.
     */
    tolerance?: number;

    /**
     * @description The spatial reference for the results. By default, the results use the spatial reference of the map service.
     */
    spatialReference?: {
        wkid?: number;
        wkt?: string;
    };
}

/** An interface that defines the outputs of the activity. */
export interface RunArcFMGasTraceOutputs {
    /**
     * @description The result of the activity.
     */
    results: {
        displayFieldName: string;
        fieldAliases: {
            [key: string]: string;
        };
        fields: {
            alias: string;
            name: string;
            type: string;
            length?: number;
        }[];
        features: {
            attributes: {
                [key: string]: any;
            };
            geometry?: any;
        }[];
        geometryType?: string;
        spatialReference?: {
            wkid?: number;
            wkt?: string;
        };
        name: string;
        id: number;
        exceededThreshold: boolean;
    }[];
}

/**
 * @category ArcFM
 * @displayName Run ArcFM Gas Trace
 * @description Runs an ArcFM gas trace operation.
 * @helpUrl https://resources.arcfmsolution.com/10.2.1d/ServerSDK/webframe.html#topic41790.html
 * @clientOnly
 * @unsupportedApps GMV
 */
@activate(ChannelProvider)
export class RunArcFMGasTrace implements IActivityHandler {
    async execute(
        inputs: RunArcFMGasTraceInputs,
        context: IActivityContext,
        type: typeof ChannelProvider
    ): Promise<RunArcFMGasTraceOutputs> {
        const { serviceUrl, traceType = "ValveIsolation", ...other } = inputs;
        if (!serviceUrl) {
            throw new Error("serviceUrl");
        }

        const channel = type.create(undefined, "arcgis");
        channel.request.url = `${inputs.serviceUrl}/exts/ArcFMMapServer/Gas%20Trace`;
        channel.request.method = "POST";
        channel.request.json = {
            f: "json",
            traceType,
            ...other,
        };

        await channel.send();

        context.cancellationToken.finally(function () {
            channel.cancel();
        });

        const responseData =
            channel.response.payload &&
            (channel.getResponseData(channel.response.payload) as any);
        const results = responseData?.results || [];

        return {
            results,
        };
    }
}
