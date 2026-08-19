import { saveFaturaAction } from './app/compras/faturas/actions';

async function main() {
    try {
        const result = await saveFaturaAction({
            fornecedor: 'TESTE FORNECEDOR',
            cnpj: '00.000.000/0000-00',
            categoria: 'Material',
            cd: 'Jundiaí',
            valor: 100,
            insumos: []
        });
        console.log("Result:", result);
    } catch (e) {
        console.error("Error:", e);
    }
}
main();
