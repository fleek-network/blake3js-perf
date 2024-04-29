from manim import *
from fleek import *
from manim.camera.moving_camera import MovingCamera

c = 0.1

class OpeningManim(MovingCameraScene):
    def construct(self):
        self.camera.frame.save_state()

        # Act 1: Get the data
        title = Title("Get the input").to_corner(UL)
        full_data = Rectangle(width=c*(16*4+8), height=4*c)
        self.play(AddTextLetterByLetter(title), Create(full_data))
        self.wait()

        # Act 2: Split the data to chunks.
        _title = Title("Split to chunks of 1024 Byte").to_corner(UL)
        chunk_text_font_size = 12
        chunk1_rect = Rectangle(width=16 * c, height=4 * c).align_to(full_data, LEFT)
        chunk1_text = Text("Chunk #0", font_size=chunk_text_font_size).move_to(chunk1_rect.get_center())
        chunk2_rect = Rectangle(width=16 * c, height=4 * c).next_to(chunk1_rect, RIGHT, buff=0)
        chunk2_text = Text("Chunk #1", font_size=chunk_text_font_size).move_to(chunk2_rect.get_center())
        chunk3_rect = Rectangle(width=16 * c, height=4 * c).next_to(chunk2_rect, RIGHT, buff=0)
        chunk3_text = Text("Chunk #2", font_size=chunk_text_font_size).move_to(chunk3_rect.get_center())
        chunk4_rect = Rectangle(width=16 * c, height=4 * c).next_to(chunk3_rect, RIGHT, buff=0)
        chunk4_text = Text("Chunk #3", font_size=chunk_text_font_size).move_to(chunk4_rect.get_center())
        chunk5_rect = Rectangle(width=8 * c, height=4 * c).next_to(chunk4_rect, RIGHT, buff=0)
        chunk5_text = Text("...", font_size=chunk_text_font_size).move_to(chunk5_rect.get_center())

        brace = Brace(chunk1_rect, sharpness=1)
        brace_label = Text("1024 Bytes", font_size=chunk_text_font_size).next_to(brace, DOWN)

        self.play(
            Transform(title, _title),
            Create(chunk1_rect), AddTextLetterByLetter(chunk1_text),
            Create(chunk2_rect), AddTextLetterByLetter(chunk2_text),
            Create(chunk3_rect), AddTextLetterByLetter(chunk3_text),
            Create(chunk4_rect), AddTextLetterByLetter(chunk4_text),
            Create(chunk5_rect), AddTextLetterByLetter(chunk5_text),
            Create(brace), AddTextLetterByLetter(brace_label)
        )
        self.remove(full_data)
        # Group the rects and texts
        chunk1 = Group(chunk1_rect, chunk1_text)
        chunk2 = Group(chunk2_rect, chunk2_text)
        chunk3 = Group(chunk3_rect, chunk3_text)
        chunk4 = Group(chunk4_rect, chunk4_text)
        chunk5 = Group(chunk5_rect, chunk5_text)

        # Add distance between the chunks
        self.play(
            Uncreate(brace), Unwrite(brace_label),
            chunk1.animate.shift(LEFT),
            chunk2.animate.shift(0.5 * RIGHT + LEFT),
            chunk3.animate.shift(1 * RIGHT + LEFT),
            chunk4.animate.shift(1.5 * RIGHT + LEFT),
            chunk5.animate.shift(2 * RIGHT + LEFT),
        )

        # Act 4: Transform
        _title = Title("Compress each chunk").to_corner(UL)
        hash1_rect = Rectangle(color=YELLOW, width=4*c, height=4*c).next_to(chunk1, DOWN)
        hash1_text = Text("H0", color=YELLOW, font_size=14).move_to(hash1_rect.get_center())
        hash2_rect = Rectangle(color=YELLOW, width=4*c, height=4*c).next_to(chunk2, DOWN)
        hash2_text = Text("H1", color=YELLOW, font_size=14).move_to(hash2_rect.get_center())
        hash3_rect = Rectangle(color=YELLOW, width=4*c, height=4*c).next_to(chunk3, DOWN)
        hash3_text = Text("H2", color=YELLOW, font_size=14).move_to(hash3_rect.get_center())
        hash4_rect = Rectangle(color=YELLOW, width=4*c, height=4*c).next_to(chunk4, DOWN)
        hash4_text = Text("H3", color=YELLOW, font_size=14).move_to(hash4_rect.get_center())
        hash5_rect = Rectangle(color=YELLOW, width=4*c, height=4*c).next_to(chunk5, DOWN)
        hash5_text = Text("H4", color=YELLOW, font_size=14).move_to(hash5_rect.get_center())

        self.play(Transform(title, _title))

        compress = Text("HashChunk(", font_size=24, color=YELLOW).next_to(chunk1, LEFT)
        compress_closed = Text(")", font_size=24, color=YELLOW).next_to(chunk1, RIGHT)

        self.play(
            AnimationGroup(
                AddTextLetterByLetter(compress),
                AddTextLetterByLetter(compress_closed),
                AnimationGroup(
                    Create(hash1_rect),
                    AddTextLetterByLetter(hash1_text)
                ),
                AnimationGroup(Uncreate(chunk1_rect), Unwrite(chunk1_text)),
                lag_ratio=1
            )
        )
        self.play(
            AnimationGroup(
                AnimationGroup(
                    compress.animate.next_to(chunk2, LEFT),
                    compress_closed.animate.next_to(chunk2, RIGHT),
                ),
                AnimationGroup(
                    Create(hash2_rect),
                    AddTextLetterByLetter(hash2_text)
                ),
                AnimationGroup(Uncreate(chunk2_rect), Unwrite(chunk2_text)),
                lag_ratio=1
            ),
            run_time=0.5
        )
        self.play(
            AnimationGroup(
                AnimationGroup(
                    compress.animate.next_to(chunk3, LEFT),
                    compress_closed.animate.next_to(chunk3, RIGHT),
                ),
                AnimationGroup(
                    Create(hash3_rect),
                    AddTextLetterByLetter(hash3_text)
                ),
                AnimationGroup(Uncreate(chunk3_rect), Unwrite(chunk3_text)),
                lag_ratio=1
            ),
            run_time=0.5
        )
        self.play(
            AnimationGroup(
                AnimationGroup(
                    compress.animate.next_to(chunk4, LEFT),
                    compress_closed.animate.next_to(chunk4, RIGHT),
                ),
                AnimationGroup(
                    Create(hash4_rect),
                    AddTextLetterByLetter(hash4_text)
                ),
                AnimationGroup(Uncreate(chunk4_rect), Unwrite(chunk4_text)),
                lag_ratio=1
            ),
            run_time=0.5
        )
        self.play(
            AnimationGroup(
                AnimationGroup(
                    compress.animate.next_to(chunk5, LEFT),
                    compress_closed.animate.next_to(chunk5, RIGHT),
                ),
                AnimationGroup(
                    Create(hash5_rect),
                    AddTextLetterByLetter(hash5_text)
                ),
                AnimationGroup(Uncreate(chunk5_rect), Unwrite(chunk5_text)),
                lag_ratio=1
            ),
            run_time=0.5
        )
        self.play(FadeOut(compress, compress_closed))

        # Create the tree
        chunk1 = Group(hash1_rect, hash1_text)
        chunk2 = Group(hash2_rect, hash2_text)
        chunk3 = Group(hash3_rect, hash3_text)
        chunk4 = Group(hash4_rect, hash4_text)
        chunk5 = Group(hash5_rect, hash5_text)

        self.play(
            chunk1.animate.shift(2 * DOWN),
            chunk2.animate.shift(2 * DOWN),
            chunk3.animate.shift(2 * DOWN),
            chunk4.animate.shift(2 * DOWN),
            chunk5.animate.shift(2 * DOWN),
        )

        # Act 4: Split the tree
        _title = Title("Form a left-complete binary tree").to_corner(UL)
        group15 = Group(chunk1, chunk2, chunk3, chunk4, chunk5)
        group14 = Group(chunk1, chunk2, chunk3, chunk4)
        group12 = Group(chunk1, chunk2)
        group34 = Group(chunk3, chunk4)
        box15 = SurroundingRectangle(group15, color=RED, buff=MED_LARGE_BUFF)
        box14 = SurroundingRectangle(group14, color=BLUE, buff=MED_SMALL_BUFF)
        box12 = SurroundingRectangle(group12, color=GREEN, buff=SMALL_BUFF)
        box34 = SurroundingRectangle(group34, color=GREEN, buff=SMALL_BUFF)
        self.play(
            Transform(title, _title),
            Create(box15),
            Create(box14),
            Create(box12),
            Create(box34)
        )

        # Act 4: Create the tree nodes
        _box12 = Rectangle(width=4*c, height=4*c, color=GREEN).next_to(box12, 2 * UP)
        _box34 = Rectangle(width=4*c, height=4*c, color=GREEN).next_to(box34, 2 * UP)
        _box14 = Rectangle(width=4*c, height=4*c, color=BLUE).next_to(Group(_box12, _box34), 2 * UP)
        _chunk5 = chunk5.copy().shift(2 * UP)
        _box15 = Rectangle(width=4*c, height=4*c, color=RED).next_to(Group(_box14, _chunk5), 2 * UP)
        self.wait()
        self.play(
            Transform(box12, _box12),
            Transform(box34, _box34),
            Transform(box14, _box14),
            Transform(box15, _box15),
            chunk5.animate.shift(2 * UP),
        )

        # Act 5: The hash
        self.wait()
        _title = Title("Return the root").to_corner(UL)
        self.play(
            Transform(title, _title),
            box15.animate.move_to(ORIGIN).scale(2),
            Uncreate(hash1_rect), Unwrite(hash1_text),
            Uncreate(hash2_rect), Unwrite(hash2_text),
            Uncreate(hash3_rect), Unwrite(hash3_text),
            Uncreate(hash4_rect), Unwrite(hash4_text),
            Uncreate(hash5_rect), Unwrite(hash5_text),
            Uncreate(box12),
            Uncreate(box34),
            Uncreate(box14),
        )

        hash_text = Text("Hash = ", font_size=14).next_to(box15, LEFT)
        self.play(
            AddTextLetterByLetter(hash_text),
        )

        self.wait(2)

    # A little hack to foce the type of camera so pyright could play nice.
    @property
    def camera(self) -> MovingCamera:
        if not type(self.renderer.camera) is MovingCamera:
          raise TypeError(f"The parameter is not an integer!")
        return self.renderer.camera
