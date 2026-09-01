import { deletableFeature, moveFeature, SPortImpl } from "sprotty";
import { Bounds } from "sprotty-protocol";

export const defaultPortFeatures = [...SPortImpl.DEFAULT_FEATURES, moveFeature, deletableFeature];
const portSize = 7;

export abstract class DfdPortImpl extends SPortImpl {
    static readonly DEFAULT_FEATURES = defaultPortFeatures;
    public customCssStyle?: Record<string, string>;

    override get bounds(): Bounds {
        return {
            x: this.position.x,
            y: this.position.y,
            width: portSize,
            height: portSize,
        };
    }
}
