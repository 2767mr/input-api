import { ig, sc } from 'ultimate-crosscode-typedefs';

export function registerInput(name: string, defaultKey1: ig.KEY, defaultKey2?: ig.KEY) {
    if (!('sc' in globalThis)) {
        throw new Error("registerOptions must be called in postload or later");
    }

    if (name.startsWith('keys-')) {
        name = name.slice(5);
    }

    let { key1, key2 } = sc.options.values[name] as { key1: ig.KEY, key2?: ig.KEY };
    ig.input.bind(key1 ?? defaultKey1, name);
    sc.fontsystem.changeKeyCodeIcon(name, key1 ?? defaultKey1);

    if (key2 != null || defaultKey2 != null) {
        ig.input.bind(key2 ?? defaultKey2!, name);
    }

    const result: sc.OptionDefinitionCommon & sc.OptionDefinition.CONTROLS = sc.OPTIONS_DEFINITION['keys-' + name] = {
        type: 'CONTROLS',
        init: { key1: defaultKey1, key2: defaultKey2 },
        cat: sc.OPTION_CATEGORY.CONTROLS,
    } satisfies sc.OptionDefinition;

    sc.KeyBinder.inject({
        changeBinding(optionId: string, key: ig.KEY, isAlternative: boolean, unbind: boolean) {
            if (optionId.slice(5) !== name) {
                return this.parent(optionId, key, isAlternative, unbind);
            }

            const optionValue = sc.options.values[optionId] as { key1: ig.KEY, key2?: ig.KEY };
            sc.options.hasChanged = true;

            const oldKey = isAlternative ? optionValue.key2 : optionValue.key1;
            if (oldKey && ig.input.bindings[oldKey] != null) {
                ig.input.unbind(oldKey);
            }

            if (isAlternative && unbind) {
                optionValue.key2 = undefined;
                return;
            }

            const conflictingAction: string = ig.input.bindings[key];

            ig.input.bind(key, name);
            sc.fontsystem.changeKeyCodeIcon(name, key);

            if (conflictingAction != null) {
                const conflictingOption = sc.options.values[`keys-${conflictingAction}`] as { key1: ig.KEY, key2?: ig.KEY };

                if (conflictingOption.key1 === key) {
                    conflictingOption.key1 = oldKey!;
                } else if (conflictingOption.key2 === key) {
                    conflictingOption.key2 = oldKey;
                } else {
                    console.error('input-api: unable to find the conflicting key binding. report ASAP!');
                }

                ig.input.bind(oldKey!, conflictingAction);
                sc.fontsystem.changeKeyCodeIcon(conflictingAction, oldKey!);
                sc.options.dispatchKeySwappedEvent();
            }

            if (isAlternative)
                optionValue.key2 = key;
            else
                optionValue.key1 = key;
        },
    });

    return result;
}

export function registerInputLabel(internalName: string, label: string) {
    if (!('sc' in globalThis)) {
        throw new Error("registerOptions must be called in postload or later");
    }

    ig.lang.labels.sc.gui.options.controls.keys[internalName] = label;
}