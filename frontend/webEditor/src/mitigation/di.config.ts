import { ContainerModule } from "inversify";
import { TYPES } from "sprotty";
import { EDITOR_TYPES } from "../editorTypes";
import { MitigationOptionsUI } from "./MitigationOptions";
import { MitigationRegistry } from "./MitigationRegistry";

export const mitigationModule = new ContainerModule((bind) => {
    bind(MitigationRegistry).toSelf().inSingletonScope();

    bind(MitigationOptionsUI).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(MitigationOptionsUI);
    bind(EDITOR_TYPES.DefaultUIElement).to(MitigationOptionsUI);
    bind(TYPES.KeyListener).toService(MitigationOptionsUI);
});
