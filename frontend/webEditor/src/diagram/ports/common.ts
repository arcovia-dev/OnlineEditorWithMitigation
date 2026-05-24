import { deletableFeature, moveFeature, SPortImpl } from "sprotty";
import { Bounds } from "sprotty-protocol";
import { VNodeStyle } from "snabbdom";

export const defaultPortFeatures = [...SPortImpl.DEFAULT_FEATURES, moveFeature, deletableFeature];
const portSize = 7;

export abstract class DfdPortImpl extends SPortImpl {
    static readonly DEFAULT_FEATURES = defaultPortFeatures;
    cssStyle?: VNodeStyle;

    override get bounds(): Bounds {
        return {
            x: this.position.x,
            y: this.position.y,
            width: portSize,
            height: portSize,
        };
    }
}
