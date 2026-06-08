import csv

items = []
seen = set()

with open('data.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        marca = row.get('MARCA')
        item = row.get('TIPO DE SERVIÇO')
        if marca in ['SAS', 'SAE'] and item:
            item = item.strip()
            if item not in seen:
                seen.add(item)
                items.append({'marca': marca, 'item': item})

# Take up to 30
items = items[:30]

sql = "-- Script para inserir dados de teste na tabela de estoque_insumos\n"
sql += "-- com valores aleatórios de estoque_real (entre 10 e 50), estoque_minimo (10) e lead_time (7)\n\n"
sql += "INSERT INTO public.estoque_insumos (cd, codigo, item, unidade, lead_time, estoque_minimo, estoque_real, status, categoria)\n"
sql += "VALUES\n"

values = []
for i, obj in enumerate(items):
    cd = f"JDI-{obj['marca']}"
    codigo = f"INS-{obj['marca']}-{str(i+1).zfill(3)}"
    item_str = obj['item'].replace("'", "''")
    values.append(f"  ('{cd}', '{codigo}', '{item_str}', 'UN', '7', 10, floor(random() * 41 + 10)::int, 'OK', 'Geral')")

sql += ",\n".join(values) + ";\n\n"
sql += "-- Atualiza o status caso o valor aleatório gerado tenha sido 10 (igual ao mínimo)\n"
sql += "UPDATE public.estoque_insumos \n"
sql += "SET status = 'CRÍTICO' \n"
sql += "WHERE estoque_real <= estoque_minimo;\n"

with open('popula_estoque_teste.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

print(f"Generated SQL for {len(items)} items.")
