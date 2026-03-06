"""
Capstone: Potential Errors in Hypothesis Testing (AP Stats Unit 6, Topic 6.7)

Comprehensive review combining all 6.7 concepts: the error decision table,
contextual interpretation, power relationships, and choosing a significance
level based on consequences. Ties everything together in a single animation.

Run with: manim -qm --format=mp4 apstat_67_capstone.py Capstone67
"""
from manim import *
import numpy as np

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


def normal_pdf(x, mu, sigma):
    return (1 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x - mu) / sigma) ** 2)


class Capstone67(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("6.7 Capstone: Errors in Testing", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== PART 1: Quick Error Table ==========
        part1 = Text("Part 1: The Error Table", font_size=26, color=TEAL_3B1B, weight=BOLD)
        part1.next_to(title, DOWN, buff=0.3)
        self.play(Write(part1), run_time=0.3)

        # Compact 2x2 table
        cell_w, cell_h = 2.5, 0.9
        table_center = DOWN * 0.3

        headers = VGroup(
            Text("H\u2080 TRUE", font_size=16, color=BLUE_3B1B, weight=BOLD),
            Text("H\u2080 FALSE", font_size=16, color=BLUE_3B1B, weight=BOLD),
        )
        headers[0].move_to(table_center + LEFT * 1.3 + UP * 1.0)
        headers[1].move_to(table_center + RIGHT * 1.3 + UP * 1.0)

        row_labels = VGroup(
            Text("Reject H\u2080", font_size=16, color=YELLOW_3B1B, weight=BOLD),
            Text("Fail to\nReject", font_size=14, color=YELLOW_3B1B, weight=BOLD),
        )
        row_labels[0].move_to(table_center + LEFT * 3.2 + UP * 0.35)
        row_labels[1].move_to(table_center + LEFT * 3.2 + DOWN * 0.55)

        cells = VGroup()
        # Type I (top-left)
        c1 = Rectangle(width=cell_w, height=cell_h, fill_opacity=0.2,
                        fill_color=RED_3B1B, stroke_color=RED_3B1B, stroke_width=2)
        c1.move_to(table_center + LEFT * 1.3 + UP * 0.35)
        c1t = Text("Type I\n\u03b1", font_size=18, color=RED_3B1B, weight=BOLD)
        c1t.move_to(c1)
        cells.add(VGroup(c1, c1t))

        # Correct (top-right)
        c2 = Rectangle(width=cell_w, height=cell_h, fill_opacity=0.15,
                        fill_color=GREEN_3B1B, stroke_color=GREEN_3B1B, stroke_width=2)
        c2.move_to(table_center + RIGHT * 1.3 + UP * 0.35)
        c2t = Text("Correct\nPower", font_size=18, color=GREEN_3B1B)
        c2t.move_to(c2)
        cells.add(VGroup(c2, c2t))

        # Correct (bottom-left)
        c3 = Rectangle(width=cell_w, height=cell_h, fill_opacity=0.15,
                        fill_color=GREEN_3B1B, stroke_color=GREEN_3B1B, stroke_width=2)
        c3.move_to(table_center + LEFT * 1.3 + DOWN * 0.55)
        c3t = Text("Correct\n1 \u2212 \u03b1", font_size=18, color=GREEN_3B1B)
        c3t.move_to(c3)
        cells.add(VGroup(c3, c3t))

        # Type II (bottom-right)
        c4 = Rectangle(width=cell_w, height=cell_h, fill_opacity=0.2,
                        fill_color=ORANGE_3B1B, stroke_color=ORANGE_3B1B, stroke_width=2)
        c4.move_to(table_center + RIGHT * 1.3 + DOWN * 0.55)
        c4t = Text("Type II\n\u03b2", font_size=18, color=ORANGE_3B1B, weight=BOLD)
        c4t.move_to(c4)
        cells.add(VGroup(c4, c4t))

        self.play(
            Write(headers), Write(row_labels),
            *[FadeIn(c) for c in cells],
            run_time=0.8,
        )
        self.wait(1.0)

        # ========== PART 2: Relationships ==========
        self.play(
            *[FadeOut(mob) for mob in self.mobjects if mob is not title],
            run_time=0.4,
        )

        part2 = Text("Part 2: The Relationships", font_size=26, color=TEAL_3B1B, weight=BOLD)
        part2.next_to(title, DOWN, buff=0.3)
        self.play(Write(part2), run_time=0.3)

        rels = [
            ("P(Type I error) = \u03b1", RED_3B1B),
            ("P(Type II error) = \u03b2", ORANGE_3B1B),
            ("Power = 1 \u2212 \u03b2", GREEN_3B1B),
            ("\u03b1 \u2191  \u2192  \u03b2 \u2193  \u2192  Power \u2191", YELLOW_3B1B),
            ("\u03b1 \u2193  \u2192  \u03b2 \u2191  \u2192  Power \u2193", YELLOW_3B1B),
        ]

        prev = part2
        for text, color in rels:
            item = Text(text, font_size=24, color=color, weight=BOLD)
            item.next_to(prev, DOWN, buff=0.25).align_to(LEFT * 3.5, LEFT)
            self.play(Write(item), run_time=0.4)
            prev = item

        self.wait(1.0)

        # ========== PART 3: Choosing Alpha ==========
        self.play(
            *[FadeOut(mob) for mob in self.mobjects if mob is not title],
            run_time=0.4,
        )

        part3 = Text("Part 3: Choosing \u03b1", font_size=26, color=TEAL_3B1B, weight=BOLD)
        part3.next_to(title, DOWN, buff=0.3)
        self.play(Write(part3), run_time=0.3)

        q = Text(
            "Which error is more consequential?",
            font_size=24, color=WHITE, weight=BOLD,
        )
        q.next_to(part3, DOWN, buff=0.3)
        self.play(Write(q), run_time=0.4)

        choice1_label = Text("If Type I is worse:", font_size=20, color=RED_3B1B, weight=BOLD)
        choice1_label.next_to(q, DOWN, buff=0.3).align_to(LEFT * 4, LEFT)
        choice1 = Text(
            "Use smaller \u03b1 (e.g. 0.01) to reduce false positives",
            font_size=18, color=WHITE,
        )
        choice1.next_to(choice1_label, DOWN, buff=0.08, aligned_edge=LEFT)

        choice2_label = Text("If Type II is worse:", font_size=20, color=ORANGE_3B1B, weight=BOLD)
        choice2_label.next_to(choice1, DOWN, buff=0.25).align_to(choice1_label, LEFT)
        choice2 = Text(
            "Use larger \u03b1 (e.g. 0.10) to increase power",
            font_size=18, color=WHITE,
        )
        choice2.next_to(choice2_label, DOWN, buff=0.08, aligned_edge=LEFT)

        self.play(Write(choice1_label), Write(choice1), run_time=0.5)
        self.play(Write(choice2_label), Write(choice2), run_time=0.5)
        self.wait(0.5)

        # Example
        example = Text(
            "Example: Medical test for a deadly disease\n"
            "\u2192 Type II (missing the disease) is worse\n"
            "\u2192 Use larger \u03b1 to maximize power",
            font_size=18, color=TEAL_3B1B,
        )
        example.next_to(choice2, DOWN, buff=0.3).align_to(choice1_label, LEFT)
        self.play(Write(example), run_time=0.6)
        self.wait(0.5)

        # Final summary box
        final = Text(
            "The consequences of each error determine\nthe appropriate significance level.",
            font_size=20, color=YELLOW_3B1B,
        )
        final.to_edge(DOWN, buff=0.35)
        final_box = SurroundingRectangle(final, color=YELLOW_3B1B, buff=0.15, corner_radius=0.1)
        self.play(Write(final), Create(final_box), run_time=0.5)
        self.wait(1.5)
