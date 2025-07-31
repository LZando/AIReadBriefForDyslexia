import fitz
import re
import csv
import json
from collections import Counter, defaultdict
from dataclasses import dataclass, asdict
from typing import List, Dict, Tuple, Optional


@dataclass
class TextBlock:
    text: str
    page_num: int
    bbox: Tuple[float, float, float, float]
    font_name: str
    font_size: float
    font_flags: int
    y_position: float

    @property
    def is_bold(self) -> bool:
        return bool(self.font_flags & 2**4)

    @property
    def is_italic(self) -> bool:
        return bool(self.font_flags & 2**1)


class ChapterDetector:
    def __init__(self, pdf_path: str):
        self.doc = fitz.open(pdf_path)
        self.text_blocks: List[TextBlock] = []
        self.font_stats: Dict = {}

    def extract_text_blocks(self) -> None:
        for page_num in range(len(self.doc)):
            page = self.doc[page_num]
            blocks = page.get_text("dict")

            for block in blocks.get("blocks", []):
                if "lines" not in block:
                    continue

                for line in block["lines"]:
                    for span in line["spans"]:
                        text = span["text"].strip()
                        if not text:
                            continue

                        bbox = span["bbox"]
                        self.text_blocks.append(TextBlock(
                            text=text,
                            page_num=page_num,
                            bbox=bbox,
                            font_name=span["font"],
                            font_size=span["size"],
                            font_flags=span["flags"],
                            y_position=bbox[1]
                        ))

    def analyze_font_statistics(self) -> None:
        font_sizes = [block.font_size for block in self.text_blocks]
        font_names = [block.font_name for block in self.text_blocks]

        size_counter = Counter(font_sizes)
        name_counter = Counter(font_names)

        self.font_stats = {
            'most_common_size': size_counter.most_common(1)[0][0],
            'largest_sizes': [size for size, _ in size_counter.most_common(10)],
            'most_common_font': name_counter.most_common(1)[0][0],
            'all_fonts': list(name_counter.keys())
        }

        print(f"Font più comune: {self.font_stats['most_common_font']}")
        print(f"Dimensione più comune: {self.font_stats['most_common_size']}")
        print(f"Dimensioni più grandi: {self.font_stats['largest_sizes'][:5]}")

    def is_potential_chapter_title(self, block: TextBlock) -> Tuple[bool, float]:
        confidence = 0.0

        chapter_patterns = [
            r'^(capitolo|chapter|cap\.?)\s+\d+',
            r'^\d+\.\s+[A-Z]',
            r'^[IVX]+\.\s+[A-Z]',
            r'^\d+\s+[A-Z][A-Z\s]+',
            r'^[A-Z][A-Z\s]{10,}$'
        ]

        for pattern in chapter_patterns:
            if re.match(pattern, block.text, re.IGNORECASE):
                confidence += 0.4
                break

        if block.font_size > self.font_stats['most_common_size'] * 1.2:
            confidence += 0.3

        if block.is_bold:
            confidence += 0.2

        page_height = self.doc[block.page_num].rect.height
        if block.y_position < page_height * 0.2:
            confidence += 0.1

        if len(block.text.split()) <= 8:
            confidence += 0.1

        if len(block.text.strip()) < 3:
            confidence = 0.0

        return confidence > 0.5, confidence

    def find_chapters(self) -> List[Dict]:
        print("\nCercando capitoli...")
        chapters = []

        for block in self.text_blocks:
            is_chapter, confidence = self.is_potential_chapter_title(block)

            if is_chapter:
                chapters.append({
                    'text': block.text,
                    'page': block.page_num + 1,
                    'confidence': confidence,
                    'font_name': block.font_name,
                    'font_size': block.font_size,
                    'is_bold': block.is_bold,
                    'y_position': block.y_position,
                    'bbox': block.bbox
                })

        chapters.sort(key=lambda x: (x['page'], x['y_position']))
        return chapters

    def get_outline_chapters(self) -> List[Dict]:
        outline_chapters = []
        try:
            outline = self.doc.get_toc()
            for level, title, page_num in outline:
                if level <= 2:
                    outline_chapters.append({
                        'text': title,
                        'page': page_num,
                        'level': level,
                        'source': 'outline'
                    })
        except Exception:
            print("Nessun outline disponibile nel PDF")
        return outline_chapters

    def analyze_document(self) -> Dict:
        self.extract_text_blocks()
        self.analyze_font_statistics()
        detected_chapters = self.find_chapters()
        outline_chapters = self.get_outline_chapters()

        return {
            'detected_chapters': detected_chapters,
            'outline_chapters': outline_chapters,
            'font_stats': self.font_stats,
            'total_pages': len(self.doc),
            'total_text_blocks': len(self.text_blocks)
        }

    def print_results(self, results: Dict) -> None:
        if results['detected_chapters']:
            print(f"\nCapitoli rilevati automaticamente ({len(results['detected_chapters'])}):")
            for i, chapter in enumerate(results['detected_chapters'], 1):
                print(f"\n{i:2d}. Pagina {chapter['page']:3d} (Confidence: {chapter['confidence']:.2f})")
                print(f"    Testo: '{chapter['text']}'")
                print(f"    Font: {chapter['font_name']}, Size: {chapter['font_size']:.1f}")
                if chapter['is_bold']:
                    print("    Formattazione: BOLD")
        else:
            print("\nNessun capitolo rilevato automaticamente")

        if results['outline_chapters']:
            print(f"\nCapitoli dall'outline ({len(results['outline_chapters'])}):")
            for chapter in results['outline_chapters']:
                print(f"  Pagina {chapter['page']:3d}: {chapter['text']}")

    def close(self):
        if self.doc:
            self.doc.close()


# =======================
# Funzione principale
# =======================
def pdfChapterIdentifier(pdf_path: str):
    detector = ChapterDetector(pdf_path)
    results = detector.analyze_document()
    detector.print_results(results)
    detector.close()
    return results



def analyze_pdf(pdf_path: str):
    return pdfChapterIdentifier(pdf_path)

def analyze_pdf_structured(pdf_path: str) -> Dict:
    detector = ChapterDetector(pdf_path)
    results = detector.analyze_document()
    
    chapters_by_title = defaultdict(list)
    for chapter in results['detected_chapters']:
        chapters_by_title[chapter['text']].append({
            'page': chapter['page'],
            'confidence': chapter['confidence'],
            'font_name': chapter['font_name'],
            'font_size': chapter['font_size'],
            'is_bold': chapter['is_bold']
        })
    
    # Crea il formato strutturato
    structured_results = {
        'metadata': {
            'total_pages': results['total_pages'],
            'total_text_blocks': results['total_text_blocks'],
            'font_stats': results['font_stats']
        },
        'chapters': {},
        'outline_chapters': results['outline_chapters'],
        'raw_detected_chapters': results['detected_chapters']
    }
    
    # Organizza i capitoli per titolo con statistiche
    for title, chapters in chapters_by_title.items():
        max_confidence = max(ch['confidence'] for ch in chapters)
        avg_confidence = sum(ch['confidence'] for ch in chapters) / len(chapters)
        pages = [ch['page'] for ch in chapters]
        
        structured_results['chapters'][title] = {
            'title': title,
            'occurrences': len(chapters),
            'max_confidence': max_confidence,
            'avg_confidence': round(avg_confidence, 3),
            'pages': pages,
            'first_page': min(pages),
            'last_page': max(pages),
            'details': chapters
        }
    
    detector.close()
    return structured_results

def filter_chapters_by_confidence(structured_results: Dict, min_confidence: float = 0.7) -> Dict:
    """
    Filtra i capitoli mantenendo solo quelli con confidenza massima >= min_confidence
    """
    filtered_chapters = {}
    
    for title, chapter_data in structured_results['chapters'].items():
        if chapter_data['max_confidence'] >= min_confidence:
            filtered_chapters[title] = chapter_data
    
    return {
        'metadata': structured_results['metadata'],
        'chapters': filtered_chapters,
        'outline_chapters': structured_results['outline_chapters'],
        'filtering_applied': {
            'min_confidence': min_confidence,
            'original_count': len(structured_results['chapters']),
            'filtered_count': len(filtered_chapters)
        }
    }

def get_top_confidence_chapters(structured_results: Dict, min_occurrences: int = 3) -> Dict:
    filtered_chapters = {}
    
    for title, chapter_data in structured_results['chapters'].items():
        if chapter_data['occurrences'] >= min_occurrences:
            # Trova l'occorrenza con confidenza massima
            best_occurrence = max(chapter_data['details'], key=lambda x: x['confidence'])
            
            filtered_chapters[title] = {
                'title': title,
                'page': best_occurrence['page'],
                'confidence': best_occurrence['confidence'],
                'font_name': best_occurrence['font_name'],
                'font_size': best_occurrence['font_size'],
                'is_bold': best_occurrence['is_bold'],
                'total_occurrences': chapter_data['occurrences']
            }
    
    return {
        'metadata': structured_results['metadata'],
        'chapters': filtered_chapters,
        'filtering_applied': {
            'min_occurrences': min_occurrences,
            'original_count': len(structured_results['chapters']),
            'filtered_count': len(filtered_chapters)
        }
    }

def save_structured_results(structured_results: Dict, output_path: str = "chapters_structured.json") -> None:
    """
    Salva i risultati strutturati in formato JSON
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(structured_results, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Risultati strutturati salvati in: {output_path}")

def save_filtered_chapters_csv(filtered_results: Dict, output_path: str = "chapters_filtered.csv") -> None:
    """
    Salva i capitoli filtrati in formato CSV
    """
    with open(output_path, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(["Titolo", "Pagina", "Confidenza", "Font", "Dimensione", "Bold", "Occorrenze"])
        
        for title, chapter_data in filtered_results['chapters'].items():
            if 'total_occurrences' in chapter_data:  # Formato get_top_confidence_chapters
                writer.writerow([
                    chapter_data['title'],
                    chapter_data['page'],
                    f"{chapter_data['confidence']:.3f}",
                    chapter_data['font_name'],
                    f"{chapter_data['font_size']:.1f}",
                    "Sì" if chapter_data['is_bold'] else "No",
                    chapter_data['total_occurrences']
                ])
            else:  # Formato filter_chapters_by_confidence
                for detail in chapter_data['details']:
                    writer.writerow([
                        chapter_data['title'],
                        detail['page'],
                        f"{detail['confidence']:.3f}",
                        detail['font_name'],
                        f"{detail['font_size']:.1f}",
                        "Sì" if detail['is_bold'] else "No",
                        chapter_data['occurrences']
                    ])
    
    print(f"✅ Capitoli filtrati salvati in: {output_path}")

def analyze_pdf_with_filtering(pdf_path: str, min_confidence: float = 0.7, min_occurrences: int = 3) -> Dict:
    """
    Analizza il PDF e applica filtri automatici per ottenere i migliori risultati
    """
    print("🔍 Analizzando PDF...")
    structured_results = analyze_pdf_structured(pdf_path)
    
    print(f"📊 Capitoli trovati: {len(structured_results['chapters'])}")
    
    # Applica filtro per confidenza
    confidence_filtered = filter_chapters_by_confidence(structured_results, min_confidence)
    print(f"🎯 Dopo filtro confidenza (≥{min_confidence}): {len(confidence_filtered['chapters'])} capitoli")
    
    # Applica filtro per occorrenze multiple
    final_results = get_top_confidence_chapters(confidence_filtered, min_occurrences)
    print(f"🏆 Capitoli finali (≥{min_occurrences} occorrenze): {len(final_results['chapters'])}")
    
    # Salva risultati
    save_structured_results(structured_results, "chapters_full.json")
    save_filtered_chapters_csv(final_results, "chapters_best.csv")
    
    return final_results



