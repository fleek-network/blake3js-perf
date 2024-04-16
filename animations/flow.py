from manim import *
from fleek import *
from manim.camera.moving_camera import MovingCamera

class OpeningManim(MovingCameraScene):
    def construct(self):
        self.camera.frame.set(width=48)
        self.camera.frame.save_state()

        # Act 1: Get all of the data and divide it into chunks.
        full_data_rect = Rectangle(width=35, height=4)
        brace = Brace(full_data_rect, sharpness=1)
        input_data_label = Text("Input Data").next_to(brace, DOWN)

        self.play(Create(full_data_rect))
        self.play(Create(brace))
        self.play(AddTextLetterByLetter(input_data_label))
        self.wait(1)

        chunks_grid = Rectangle(width=32, height=4, grid_xstep=16).align_to(full_data_rect, LEFT)
        v_chunk1 = Rectangle(width=16, height=4, grid_xstep=1).align_to(chunks_grid, LEFT)
        v_chunk2 = Rectangle(width=16, height=4).next_to(v_chunk1, RIGHT, buff=0)
        v_chunk3 = Rectangle(width=3, height=4).next_to(v_chunk2, RIGHT, buff=0)
        br = Brace(v_chunk1, sharpness=1)
        chunk1_label = Text("Chunk #0").next_to(br, DOWN)

        chunk1_size_text = Text("1024 Bytes").move_to(v_chunk1.get_center())
        chunk2_size_text = Text("1024 Bytes").move_to(v_chunk2.get_center())
        chunk3_size_text = Text("...").move_to(v_chunk3.get_center())

        self.play(
            Create(chunks_grid),
            AddTextLetterByLetter(chunk1_size_text),
            AddTextLetterByLetter(chunk2_size_text),
            AddTextLetterByLetter(chunk3_size_text),
        )
        self.play(
            Unwrite(input_data_label),
            Transform(brace, br),
        )
        self.play(AddTextLetterByLetter(chunk1_label))

        # Act 2: Now we care about inside of a chunk
        blocks_grid = v_chunk1
        self.play(self.camera.auto_zoom([v_chunk1], only_mobjects_in_frame=True, margin=1))

        num_blocks_text = Text("16 Blocks").next_to(brace, DOWN)
        self.play(Transform(chunk1_label, num_blocks_text), Unwrite(chunk1_size_text))
        self.play(Create(blocks_grid))

        # Act 3: Show inside a block
        words_grid = Rectangle(width=1, height=4, grid_xstep=0.5, grid_ystep=0.5).align_to(blocks_grid, LEFT)
        self.play(self.camera.auto_zoom([words_grid], only_mobjects_in_frame=True, margin=4))

        br = Brace(words_grid, sharpness=1)
        block_label = Text("Block").next_to(br, DOWN)
        self.play(Unwrite(chunk1_label), Transform(brace, br))
        self.play(Create(words_grid), AddTextLetterByLetter(block_label))

        active_area = Rectangle(width=0.5, height=0.5, color=BLUE, fill_opacity=0.5).align_to(words_grid, UP + LEFT)
        num_words_text = Text("16 Words").next_to(br, DOWN)
        self.play(
            FadeIn(active_area),
            Transform(block_label, num_words_text),
        )
        self.wait(0.5)

        active_area_v = Rectangle(width=1, height=4, color=BLUE, fill_opacity=0.5).align_to(words_grid, LEFT)
        self.play(
            Uncreate(brace), Unwrite(block_label),
            Uncreate(words_grid), Transform(active_area, active_area_v)
        )

        # Act 4: By now we explained the meaning of chunk, block and word.
        self.play(Restore(self.camera.frame))
        self.play(self.camera.frame.animate.shift(DOWN * 10))

        code = '''cv := iv()
for block in current_chunk:
    cv <- compress(cv, block)
push_to_stack(cv)
        '''
        rendere_code = Code(
            code=code, tab_width=4, language="maxima", font="Monospace",
            font_size=36, background="window"
        ).align_to(self.camera.frame, LEFT + UP).shift(DOWN * 7 + RIGHT)
        self.play(Create(rendere_code))

        # Create compress rect
        compress_rect = Rectangle(width=4, height=3, color=RED_A, fill_opacity=0.5).move_to(self.camera.frame.get_center())
        compress_text = Text("Compress").move_to(compress_rect.get_center())
        self.play(Create(compress_rect), AddTextLetterByLetter(compress_text))
        cv_in_arrow = Arrow(start=LEFT, end=RIGHT, color=GOLD).next_to(compress_rect, LEFT + UP, buff=0).shift(0.5 * DOWN)
        cv_in_text = Text("IV()").next_to(cv_in_arrow, LEFT)
        blk_in_arrow = Arrow(start=LEFT, end=RIGHT, color=GOLD).next_to(compress_rect, LEFT + DOWN, buff=0).shift(0.5 * UP)
        blk_in_text = Text("Block").next_to(blk_in_arrow, LEFT)
        out_arrow = Arrow(start=LEFT, end=RIGHT, color=GOLD).next_to(compress_rect, RIGHT + UP, buff=0).shift(0.5 * DOWN)
        self.play(
            Create(cv_in_arrow), AddTextWordByWord(cv_in_text),
            Create(blk_in_arrow), AddTextWordByWord(blk_in_text),
            Create(out_arrow)
        )

        self.wait()

    # A little hack to foce the type of camera so pyright could play nice.
    @property
    def camera(self) -> MovingCamera:
        if not type(self.renderer.camera) is MovingCamera:
          raise TypeError(f"The parameter is not an integer!")
        return self.renderer.camera
