import os
import json
from chapteridentifier import analyze_pdf_with_filtering, analyze_pdf_structured, filter_chapters_by_confidence, get_top_confidence_chapters

def main():
    pdf_path = r"alan.pdf"

    try:
        results = analyze_pdf_with_filtering(pdf_path, min_confidence=0.5, min_occurrences=4)

        # Mostra i capitoli finali
        if results['chapters']:
            print(f"\nCapitoli ({len(results['chapters'])}):")
            for i, (title, chapter_data) in enumerate(results['chapters'].items(), 1):
                print(f"\n{i:2d}. {chapter_data['title']}")
                print(f"    📄 Pagina: {chapter_data['page']}")
                print(f"    🎯 Confidenza: {chapter_data['confidence']:.3f}")
                print(f"    📊 Occorrenze totali: {chapter_data['total_occurrences']}")
                int(f"    🔤 Font: {chapter_data['font_name']} ({chapter_data['font_size']:.1f}pt)")
                print(f"    💪 Bold: {'Sì' if chapter_data['is_bold'] else 'No'}")
        else:
            print("\n❌ Nessun capitolo trovato con i criteri specificati")
            print("💡 Prova a ridurre i valori di min_confidence o min_occurrences")

        # Salva il file JSON con lo stesso nome base del PDF
        output_folder = os.path.dirname(pdf_path)
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        json_output_path = os.path.join(output_folder, f"{base_name}.json")

        with open(json_output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        print(f"\n📁 File generati:")
        print(f"   • {json_output_path} - Tutti i risultati strutturati in JSON")
        print(f"   • chapters_best.csv - Capitoli filtrati in CSV (se creato altrove)")

        print(f"\n✅ Analisi completata con successo!")

    except FileNotFoundError:
        print(f"❌ Errore: File non trovato: {pdf_path}")
        print("Assicurati che il percorso del file sia corretto.")
    except Exception as e:
        print(f"❌ Errore durante l'analisi: {str(e)}")

if __name__ == "__main__":
    main()
