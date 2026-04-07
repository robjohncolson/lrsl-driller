"""
L01 — Zeros & Multiplicity Vocabulary
Covers the key vocab terms tested in this level: zero/root, multiplicity,
end behavior, Zero-Product Property, and interval notation.

Run with:
manim -qm --format=mp4 a01_zero_mult_vocab.py ZeroMultVocab
"""
from manim import *
from common import ACCENT, BG, INK, MUTED, NEG, POS, SOFT, footer_note, setup_scene, simple_axes


class ZeroMultVocab(Scene):
    def construct(self):
        setup_scene(self, "Key Vocabulary")

        # ── Card 1: Zero ──
        zero_card = RoundedRectangle(width=5.4, height=0.9, corner_radius=0.14, color=ACCENT)
        zero_card.set_fill(BG, opacity=1)
        zero_label = Text("Zero (root)", font_size=26, weight=BOLD, color=ACCENT)
        zero_def = Text("The x-value where f(x) = 0", font_size=22, color=INK)
        zero_row = VGroup(zero_label, zero_def).arrange(RIGHT, buff=0.4)
        zero_row.move_to(zero_card)
        zero_group = VGroup(zero_card, zero_row)

        # ── Card 2: Multiplicity ──
        mult_card = RoundedRectangle(width=5.4, height=0.9, corner_radius=0.14, color=SOFT)
        mult_card.set_fill(BG, opacity=1)
        mult_label = Text("Multiplicity", font_size=26, weight=BOLD, color=SOFT)
        mult_def = MathTex(r"(x-a)^k \;\Rightarrow\; k", font_size=28, color=INK)
        mult_row = VGroup(mult_label, mult_def).arrange(RIGHT, buff=0.4)
        mult_row.move_to(mult_card)
        mult_group = VGroup(mult_card, mult_row)

        # ── Card 3: End behavior ──
        end_card = RoundedRectangle(width=5.4, height=0.9, corner_radius=0.14, color=POS)
        end_card.set_fill(BG, opacity=1)
        end_label = Text("End behavior", font_size=26, weight=BOLD, color=POS)
        end_def = MathTex(r"x\to\pm\infty", font_size=28, color=INK)
        end_row = VGroup(end_label, end_def).arrange(RIGHT, buff=0.4)
        end_row.move_to(end_card)
        end_group = VGroup(end_card, end_row)

        # ── Card 4: Zero-Product Property ──
        zpp_card = RoundedRectangle(width=5.4, height=0.9, corner_radius=0.14, color=NEG)
        zpp_card.set_fill(BG, opacity=1)
        zpp_label = Text("Zero-Product", font_size=26, weight=BOLD, color=NEG)
        zpp_def = MathTex(r"ab=0 \;\Rightarrow\; a=0 \text{ or } b=0", font_size=26, color=INK)
        zpp_row = VGroup(zpp_label, zpp_def).arrange(RIGHT, buff=0.4)
        zpp_row.move_to(zpp_card)
        zpp_group = VGroup(zpp_card, zpp_row)

        # ── Card 5: Interval notation ──
        int_card = RoundedRectangle(width=5.4, height=0.9, corner_radius=0.14, color=MUTED)
        int_card.set_fill(BG, opacity=1)
        int_label = Text("Interval notation", font_size=26, weight=BOLD, color=MUTED)
        int_def = MathTex(r"(-2,0)\cup(2,\infty)", font_size=28, color=INK)
        int_row = VGroup(int_label, int_def).arrange(RIGHT, buff=0.4)
        int_row.move_to(int_card)
        int_group = VGroup(int_card, int_row)

        cards = VGroup(zero_group, mult_group, end_group, zpp_group, int_group)
        cards.arrange(DOWN, buff=0.22)
        cards.shift(DOWN * 0.15)

        for card in cards:
            self.play(FadeIn(card, shift=RIGHT * 0.3), run_time=0.5)

        self.play(*[Indicate(cards[i][0], color=ACCENT) for i in range(5)], run_time=0.8)

        self.add(footer_note("These terms appear throughout every level of this lesson."))
        self.wait(2)
