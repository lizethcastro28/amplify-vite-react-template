import type { Schema } from "../../data/resource"

export const handler: Schema["fetchDataDana"]["functionHandler"] = async (event) => {
        // arguments typed from `.arguments()`
    // arguments typed from `.arguments()`
    const { dana } = event.arguments
    return `Respuesta de mi lambda, ${dana}!`
};