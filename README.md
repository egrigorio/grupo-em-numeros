# Grupo em números

Site estático que analisa exports `.txt` do WhatsApp inteiramente no navegador. Não faz uploads, não tem base de dados e não envia o conteúdo da conversa a nenhum servidor. Reconhece exports com datas DD/MM e MM/DD (a ordem é inferida quando um dos campos passa de 12).

## Uso

Abra `dist/index.html` num navegador ou publique a pasta `dist` como um site estático. Escolha o ficheiro exportado, confirme os nomes dos membros e use **Guardar PDF** para baixar o relatório em PDF. O PDF mantém cada gráfico inteiro numa página, inclui resumo, metodologia e numeração de páginas.

## Métricas

Inclui mensagens por membro, hora/dia de atividade, tamanho médio, evolução diária, menções, inícios de conversa (>60 min de silêncio) e tempo médio de resposta. As regras de cálculo aparecem no próprio relatório.
